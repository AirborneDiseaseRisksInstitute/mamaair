#!/usr/bin/env bash

set -euo pipefail

PACKAGE_NAME="africa.mamaair.mobile"
MAIN_COMPONENT="${PACKAGE_NAME}/.MainActivity"
SECURE_STORAGE_ERROR="Secure storage is temporarily unavailable."
MODE=""
APK_PATH=""
DEVICE_SERIAL="${ANDROID_SERIAL:-}"
WAIT_SECONDS=7
RESTART_COUNT=2

usage() {
  cat <<'EOF'
Usage:
  secure-storage-smoke.sh --mode fresh --apk PATH [--serial SERIAL]
  secure-storage-smoke.sh --mode session [--apk PATH] [--serial SERIAL]

Modes:
  fresh    Uninstalls MamaAir, installs the supplied standalone APK, launches
           it, then force-stops and relaunches it twice. This mode deliberately
           deletes app data and therefore refuses to run on a physical device.

  session  Preserves existing app data, then force-stops and relaunches the
           installed app twice. Use this after signing in, including with an
           APK installed from Google Play Internal testing. If --apk is given,
           that APK is installed with -r first so existing app data is kept.

Options:
  --apk PATH       Standalone APK to install. Required for fresh mode.
  --serial SERIAL  adb device serial. Defaults to ANDROID_SERIAL or the only
                   connected device.
  --wait SECONDS   Seconds to allow each launch to settle (default: 7).
  --restarts N     Number of force-stop/relaunch cycles (default: 2).
  -h, --help       Show this help.
EOF
}

fail() {
  printf 'FAIL: %s\n' "$*" >&2
  exit 1
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --mode)
      [[ $# -ge 2 ]] || fail "--mode requires a value"
      MODE="$2"
      shift 2
      ;;
    --apk)
      [[ $# -ge 2 ]] || fail "--apk requires a path"
      APK_PATH="$2"
      shift 2
      ;;
    --serial)
      [[ $# -ge 2 ]] || fail "--serial requires a value"
      DEVICE_SERIAL="$2"
      shift 2
      ;;
    --wait)
      [[ $# -ge 2 ]] || fail "--wait requires a value"
      WAIT_SECONDS="$2"
      shift 2
      ;;
    --restarts)
      [[ $# -ge 2 ]] || fail "--restarts requires a value"
      RESTART_COUNT="$2"
      shift 2
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    *)
      fail "unknown argument: $1"
      ;;
  esac
done

[[ "$MODE" == "fresh" || "$MODE" == "session" ]] || {
  usage >&2
  fail "--mode must be fresh or session"
}
[[ "$WAIT_SECONDS" =~ ^[1-9][0-9]*$ ]] || fail "--wait must be a positive integer"
[[ "$RESTART_COUNT" =~ ^[1-9][0-9]*$ ]] || fail "--restarts must be a positive integer"
command -v adb >/dev/null 2>&1 || fail "adb was not found in PATH"

if [[ -z "$DEVICE_SERIAL" ]]; then
  DEVICE_SERIAL="$(adb devices | awk 'NR > 1 && $2 == "device" { print $1 }')"
  DEVICE_COUNT="$(printf '%s\n' "$DEVICE_SERIAL" | awk 'NF { count++ } END { print count + 0 }')"
  [[ "$DEVICE_COUNT" -eq 1 ]] || fail "connect exactly one adb device or pass --serial"
fi

ADB=(adb -s "$DEVICE_SERIAL")
[[ "$("${ADB[@]}" get-state 2>/dev/null)" == "device" ]] || {
  fail "adb device $DEVICE_SERIAL is not ready"
}

if [[ -n "$APK_PATH" ]]; then
  [[ -f "$APK_PATH" ]] || fail "APK does not exist: $APK_PATH"
  command -v unzip >/dev/null 2>&1 || fail "unzip is required to inspect the APK"
  APK_ENTRIES="$(unzip -Z1 "$APK_PATH")"
  [[ "$APK_ENTRIES" == *"assets/index.android.bundle"* ]] || {
    fail "APK has no embedded Metro bundle and is not standalone"
  }
fi

is_installed() {
  "${ADB[@]}" shell pm path "$PACKAGE_NAME" 2>/dev/null | grep -q '^package:'
}

install_fresh_apk() {
  [[ -n "$APK_PATH" ]] || fail "--apk is required in fresh mode"
  [[ "$("${ADB[@]}" shell getprop ro.kernel.qemu | tr -d '\r')" == "1" ]] || {
    fail "fresh mode deletes app data and is restricted to Android emulators"
  }

  printf 'Fresh-installing %s on emulator %s (existing app data will be deleted).\n' \
    "$APK_PATH" "$DEVICE_SERIAL"
  if is_installed; then
    "${ADB[@]}" uninstall "$PACKAGE_NAME" >/dev/null
  fi
  "${ADB[@]}" install "$APK_PATH" >/dev/null
}

install_preserving_data() {
  [[ -n "$APK_PATH" ]] || return 0
  local install_output

  printf 'Updating %s on %s while preserving app data.\n' "$APK_PATH" "$DEVICE_SERIAL"
  if ! install_output="$("${ADB[@]}" install -r "$APK_PATH" 2>&1)"; then
    printf '%s\n' "$install_output" >&2
    fail "APK update failed; if signatures differ, test the installed Play build without --apk or use fresh mode on a disposable emulator"
  fi
}

prepare_device() {
  "${ADB[@]}" shell input keyevent KEYCODE_WAKEUP >/dev/null 2>&1 || true
  "${ADB[@]}" shell wm dismiss-keyguard >/dev/null 2>&1 || true
}

launch_app() {
  local phase="$1"
  local launch_output

  "${ADB[@]}" logcat -c >/dev/null 2>&1 || true
  launch_output="$("${ADB[@]}" shell am start -W -n "$MAIN_COMPONENT" 2>&1)"
  [[ "$launch_output" == *"Activity: $MAIN_COMPONENT"* ]] || {
    printf '%s\n' "$launch_output" >&2
    fail "$phase did not resolve to $MAIN_COMPONENT"
  }
  if [[ "$launch_output" != *'Status: ok'* ]]; then
    printf 'WARN: %s did not report first-frame readiness through am start -W.\n' "$phase"
  fi
  sleep "$WAIT_SECONDS"
}

read_ui_dump() {
  local remote_dump="/data/local/tmp/mamaair-secure-storage-smoke.xml"

  if "${ADB[@]}" shell uiautomator dump "$remote_dump" >/dev/null 2>&1; then
    "${ADB[@]}" exec-out cat "$remote_dump" 2>/dev/null || true
    "${ADB[@]}" shell rm -f "$remote_dump" >/dev/null 2>&1 || true
    return 0
  fi
  return 1
}

assert_healthy_launch() {
  local phase="$1"
  local pid=""
  local attempt
  local ui_dump
  local crash_log
  local focused_window

  for attempt in 1 2 3 4 5 6 7 8 9 10; do
    pid="$("${ADB[@]}" shell pidof "$PACKAGE_NAME" 2>/dev/null | tr -d '\r')"
    [[ -n "$pid" ]] && break
    sleep 1
  done
  [[ -n "$pid" ]] || fail "$phase ended without a running MamaAir process"

  focused_window="$("${ADB[@]}" shell dumpsys window 2>/dev/null | grep 'mCurrentFocus' | head -1)"
  [[ "$focused_window" == *"$PACKAGE_NAME"* ]] || {
    fail "$phase did not leave MamaAir in the foreground: $focused_window"
  }

  if ui_dump="$(read_ui_dump)"; then
    [[ "$ui_dump" != *"$SECURE_STORAGE_ERROR"* ]] || {
      fail "$phase displayed the secure-storage recovery screen"
    }
  else
    # React Native screens with continuous animations may never satisfy
    # UIAutomator's idle requirement. A static bootstrap error does, so keep
    # process/crash/foreground checks authoritative and report this fallback.
    printf 'WARN: %s UI stayed busy; secure-storage text inspection was skipped.\n' "$phase"
  fi

  crash_log="$("${ADB[@]}" logcat -d -b crash 2>/dev/null || true)"
  if [[ "$crash_log" == *"$PACKAGE_NAME"* ]]; then
    printf '%s\n' "$crash_log" >&2
    fail "$phase produced an Android crash entry"
  fi

  printf 'PASS: %s (pid %s)\n' "$phase" "$pid"
}

prepare_device
if [[ "$MODE" == "fresh" ]]; then
  install_fresh_apk
else
  install_preserving_data
  is_installed || fail "$PACKAGE_NAME is not installed"
fi

if [[ "$MODE" == "fresh" ]]; then
  launch_app "fresh-install launch"
  assert_healthy_launch "fresh-install launch"
fi

for ((restart = 1; restart <= RESTART_COUNT; restart++)); do
  "${ADB[@]}" shell am force-stop "$PACKAGE_NAME"
  launch_app "restart $restart"
  assert_healthy_launch "restart $restart"
done

printf 'Secure-storage lifecycle smoke test passed in %s mode on %s.\n' \
  "$MODE" "$DEVICE_SERIAL"
if [[ "$MODE" == "session" ]]; then
  printf 'Manual check: confirm the previously authenticated account returned to its expected screen.\n'
fi
