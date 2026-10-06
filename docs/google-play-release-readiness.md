# Google Play Release Readiness

Audit date: 2026-10-02
Package: `africa.mamaair.mobile`
Current Android version: `versionCode 31`, `versionName 3.2`
Current status: **NO-GO for production upload**

Release scope: **Android / Google Play only.** iOS build, signing, CocoaPods,
and App Store readiness are intentionally out of scope for this release.

This is the operational source of truth for the first Google Play release. Do
not submit to production until every item under "Release blockers" is closed.

## What is already compliant

- The app targets Android 16 / API 36, which meets the requirement in force
  from 31 August 2026.
- The minimum SDK is 24 and both `armeabi-v7a` and `arm64-v8a` are built.
- Release builds use R8 code shrinking and resource shrinking.
- Cleartext HTTP is disabled for release builds.
- Release signing cannot silently fall back to the debug key.
- Release Android lint now fails the build on errors.
- The obsolete Quick SQLite native library was replaced with
  `react-native-nitro-sqlite@10.1.0` while retaining `mamaair.sqlite` for
  upgrade compatibility. Android lint has no 16 KB warning, and all 20 merged
  arm64 ELF libraries have load-segment alignment of at least `2^14`.
- React Native was updated within the 0.83 release line to `0.83.10`, bringing
  the matching Metro patch that removes the vulnerable `image-size` parser.
- Reanimated/Worklets now use the officially compatible React Native 0.83 pair
  (`4.6.0` / `0.12.2`).
- The retired shared `X-API-Key` was removed from normal requests and token
  refresh after the live authentication endpoints were verified without it.
- Production dependency audit currently reports zero vulnerabilities.
- Android 8+ uses adaptive and monochrome launcher icons, with a dedicated
  round fallback for Android 7.0/7.1.
- The Android namespace, application ID, Kotlin package, generated manifest,
  and built APK all use the final Play package `africa.mamaair.mobile`.
- App data backup and device-to-device transfer are disabled and explicitly
  exclude auth, profile, health, and location stores.
- Unused broad storage, Do Not Disturb, and exact-alarm permissions inherited
  from libraries are removed or made unavailable to supported devices.
- Account deletion exists in App Settings and clears the local session,
  locally queued locations, notifications, and demo progress after the server
  confirms deletion.
- Privacy Policy and Terms text are reachable in the app from authentication,
  consent, settings, and privacy screens.
- Location access is preceded by an in-app explanation and is user initiated.
- The old forced three-second ad interruption is not used. Ads are inline in
  Today after Daily Plan.

## Last local verification

Verified on 2026-10-02 without Play Console credentials or a release signing
key:

- `npm run verify`: TypeScript and ESLint completed with zero errors; all 137
  Jest suites and 591 tests passed. ESLint reports 39 non-blocking warnings.
- `:app:lintRelease`: passed with 0 errors and 10 warnings; no `Aligned16KB`,
  adaptive-icon, or launcher-shape finding.
- `:app:assembleDebug`: passed and produced a 105 MB debug APK.
- Direct APK inspection reports application ID `africa.mamaair.mobile`; the
  merged release manifest resolves `MainApplication`, `MainActivity`, and the
  generated dynamic-receiver permission under the same package.
- `:app:mergeReleaseNativeLibs`: passed; direct `objdump` inspection found all
  20 arm64 ELF libraries aligned to at least `2^14` and no failures.
- `npm audit --omit=dev`: zero vulnerabilities; `npm ls --all` exits cleanly.
- `:app:bundleRelease` without signing secrets: rejected immediately with the
  intended release-signing guard; no unsigned or debug-signed AAB was emitted.

The signed release AAB is deliberately not generated until the organisation's
upload key is created and configured. The Gradle release guard prevents a
debug-signed artifact from being mistaken for a production release.

## Release blockers

### P0 — must close before uploading an AAB

1. **HERE credential is embedded in the application bundle**
   - `src/services/logic/IndoorOutdoorClassifier.ts` still contains a HERE REST
     key. Removing it without a replacement would silently change the existing
     indoor/outdoor exposure algorithm.
   - Moving the value into `.env` does not protect it in a mobile app. The
     backend needs a reverse-geocoding proxy, after which the exposed key must
     be rotated. This requires backend/HERE-account coordination.

2. **No public policy and deletion URLs have been verified**
   - Play requires an active, public, non-geofenced, non-PDF Privacy Policy URL.
   - Because users create accounts, Play also requires a prominent public web
     path where a user can request account and data deletion without reinstalling
     the app. The website root alone is not sufficient.
   - Publish both pages under the MamaAir domain and ensure wording matches the
     app, backend retention, HERE processing, Google sign-in, and avatar service.

3. **Upload signing key is not configured**
   - Create a dedicated upload key, store it in the organisation's password/
     secrets manager, and back it up separately.
   - Put the following values in the release machine's user Gradle properties,
     never in this repository: `MYAPP_UPLOAD_STORE_FILE`,
     `MYAPP_UPLOAD_STORE_PASSWORD`, `MYAPP_UPLOAD_KEY_ALIAS`, and
     `MYAPP_UPLOAD_KEY_PASSWORD`.
   - Enrol in Play App Signing. Keep the upload key separate from the Google-
     managed app-signing key.

4. **Production backend acceptance is not complete**
   - Test email registration and verification, password reset, Google sign-in,
     token refresh, onboarding save, symptoms, daily plan completion, location
     upload, notification scheduling, logout, and account deletion with real
     production-like accounts.
   - Confirm deletion removes server-side data and document any legally required
     retention exception in the public deletion page and privacy policy.

5. **Google Sign-In is not registered for the final Android package**
   - The app now builds as `africa.mamaair.mobile`, but the checked-in
     `android/app/google-services.json` was issued for `com.mamaair`. Do not
     manually edit that generated file: its Android OAuth client IDs remain
     registered to the old package. The file is currently not consumed by the
     build because the Google Services Gradle plugin is not applied.
   - In Google Cloud/Firebase Console, create an Android OAuth client for
     `africa.mamaair.mobile`. Register the debug certificate for local testing,
     the organisation upload certificate, and the Google Play App Signing
     certificate, including both SHA-1 and SHA-256 where the console supports
     them. The current debug certificate SHA-1 is
     `5E:8F:16:06:2E:A3:CD:2C:4A:0D:54:78:76:BA:A6:F3:8C:AB:F6:25` and SHA-256
     is `FA:C6:17:45:DC:09:03:78:6F:B9:ED:E6:2A:96:2B:39:9F:73:48:F0:BB:6F:89:9B:83:32:66:75:91:03:3B:9C`.
   - Keep the existing Web OAuth client ID as the ID-token audience unless the
     OAuth project is intentionally changed. If Firebase or the Google Services
     Gradle plugin is enabled later, replace `google-services.json` with a newly
     downloaded file containing the final package.

6. **Health/legal sign-off is missing**
   - A qualified owner must approve the pregnancy, symptom, environmental-risk,
     recommendation, ad, disclaimer, and emergency wording.
   - Decide and document whether MamaAir is a wellness information product or a
     regulated medical product in every launch country. Do not submit conflicting
     claims in the app and store listing.

### P1 — close before production rollout

- Obtain brand review of the new adaptive launcher icon before the store assets
  are exported. Android lint no longer reports a round-icon warning.
- `react-native-reanimated` and `react-native-worklets` still trigger a known
  Android lint 8.8 crash while lint analyses their own Gradle scripts. Only
  those two dependency lint tasks are excluded; app lint and all other
  dependency lint tasks remain enabled.
- Move auth tokens and locally stored health/profile data to a reviewed secure-
  storage design. Current MMKV stores are app-sandboxed but are not configured
  with platform-backed encryption.
- After the OAuth registration blocker is closed, test Google sign-in from
  both a locally signed debug install and an Internal testing Play install.
- Capture clean phone screenshots in light and dark mode and all listing
  languages. Do not include debug UI, personal data, misleading medical claims,
  or unapproved third-party branding.

## Play Console declarations

Complete these before the first Closed testing release:

1. **Developer verification** — complete identity/contact verification and
   register package `africa.mamaair.mobile`. The package name cannot be changed
   after the app is created.
2. **App access** — mark the app as login-restricted and provide a durable review
   account plus exact instructions. It must bypass email expiry, location
   restrictions, and one-time setup blockers during review.
3. **Ads** — answer **Yes, contains ads**. MamaAir displays inline diaper/drug
   promotional creative even though it does not use a third-party ad SDK.
4. **Target audience** — select adults only unless legal/product explicitly
   decides to support children and completes the Families requirements.
5. **Content rating** — answer the questionnaire from the actual app content,
   including health/medical content and advertising.
6. **Health apps declaration** — this is a health app. Review and select every
   applicable category; likely candidates based on current features include
   Activity and Fitness, Nutrition and Weight Management, Sleep Management,
   Stress Management/Relaxation, and pregnancy-related health management. A
   clinical/legal owner must make the final classification.
7. **Foreground service declaration** — declare the `location` foreground
   service, describe the user-visible tracking feature and effect of interruption,
   and provide a video showing the user enabling tracking and the persistent
   notification.
8. **Data safety** — use the draft below, then reconcile it with the production
   backend and every service-provider contract before submission.
9. **Account deletion** — submit the public deletion URL and confirm that the
   in-app App Settings path works with the review account.
10. **Privacy Policy** — submit the public privacy URL; keep the same link or
    full text available in the app.
11. **Store listing** — provide support contact details, app name, compliant
    short/full descriptions, a 512x512 Play icon, a 1024x500 feature graphic,
    and at least two phone screenshots. Localise English, French, and Swahili
    only when each listing has been reviewed.
12. **Release notes and countries** — use factual wording and enable only
    countries where health/legal, privacy, backend capacity, and support are
    ready.

## Data Safety draft — requires backend confirmation

| Play data type | Current evidence | Collection/use to declare |
| --- | --- | --- |
| Name | Profile and Google sign-in; name may be sent to `ui-avatars.com` | Account management, app functionality, personalisation; confirm whether avatar processing counts as sharing under the provider contract |
| Email address | Email/Google authentication and profile | Account management, authentication, app functionality |
| User IDs | Backend user ID, access/refresh session | Account management and security |
| Precise and approximate location | Fine/coarse permissions, local queue, MamaAir movement upload, HERE reverse geocoding | App functionality and personalisation; sharing classification for HERE depends on the service-provider relationship |
| Health information | Pregnancy week/dates, height, weight, symptoms, mood/feelings, hydration, sleep/activity/lifestyle and exposure-related records | Health features, app functionality, and personalisation |
| App interactions | Daily check-ins, tasks, recommendation completion, reminder settings | App functionality and personalisation; do not claim analytics unless queued product events are actually uploaded |
| Photos | User-chosen profile image is currently stored locally; Google profile/avatar behaviour needs backend confirmation | Declare only if the backend or an SDK uploads or retains it |
| Device or other IDs | No ad ID permission or ad SDK appears in the merged manifest | Recheck Google sign-in/Play Services and production SDK disclosures before answering No |

For every collected type, verify: optional versus required, ephemeral versus
retained, linked to identity, encrypted in transit, deletion behaviour, and
whether it is shared. Google treats SDK behaviour as the developer's
responsibility. Do not submit this table unchanged without backend confirmation.

## Testing-track constraint

If the Play Console account is a **personal account created after 13 November
2023**, production access is not available today: Google requires a Closed test
with at least 12 opted-in testers continuously for 14 days, followed by a
production-access application. Organisation accounts and older personal
accounts can have different eligibility; confirm the account type in Console.

Recommended path:

1. Internal testing with the signed AAB and Play-installed Google sign-in.
2. Closed testing; satisfy the 12-testers/14-days rule if it applies.
3. Fix every Pre-launch report crash, ANR, accessibility, security, and device-
   compatibility finding.
4. Staged production rollout (for example 5%, then 20%, then 100%) with crash/
   ANR and backend monitoring between stages.

## Release build procedure

After all P0 blockers are closed and signing is configured:

```sh
npm ci
npm run verify
cd android
./gradlew clean lintRelease bundleRelease
```

Expected artifact:

`android/app/build/outputs/bundle/release/app-release.aab`

Before upload:

- Inspect the full Git diff and ensure the working tree contains only approved
  release changes.
- Confirm `versionCode` has never been used in Play Console.
- Verify the AAB certificate is the intended upload certificate.
- Re-run Android Studio APK Analyzer / the official ELF alignment check and
  confirm every `arm64-v8a` library is 16 KB compatible.
- Upload first to Internal testing, not Production.
- Download a Play-generated APK from App Bundle Explorer and smoke-test it on
  at least Android 7, Android 13, Android 15/16, a small phone, and a 16 KB
  page-size environment.

## Official references

- Target API requirements: https://support.google.com/googleplay/android-developer/answer/11926878
- 16 KB page sizes: https://developer.android.com/guide/practices/page-sizes
- Data Safety: https://support.google.com/googleplay/android-developer/answer/10787469
- Account deletion: https://support.google.com/googleplay/android-developer/answer/13327111
- Health declaration: https://support.google.com/googleplay/android-developer/answer/14738291
- Health policy: https://support.google.com/googleplay/android-developer/answer/16679511
- Foreground service declaration: https://support.google.com/googleplay/android-developer/answer/13392821
- App review declarations and access: https://support.google.com/googleplay/android-developer/answer/9859455
- New personal-account testing: https://support.google.com/googleplay/android-developer/answer/14151465
- Store listing assets: https://support.google.com/googleplay/android-developer/answer/9866151
- App signing: https://developer.android.com/studio/publish/app-signing
