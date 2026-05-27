import { Linking, Platform } from 'react-native';
import { storage } from '../../store/useAuthStore';

/**
 * Helps users enable Autostart on Chinese OEM phones (Xiaomi/Oppo/Vivo/Huawei).
 *
 * On these OEMs, foreground services and BackgroundFetch are killed regardless of
 * Android's standard battery-optimization settings. The ONLY way to keep tracking
 * alive is for the user to enable a per-app "Autostart" toggle in OEM settings —
 * no SDK or library bypasses this. We open the OEM-specific settings screen and
 * show a one-time guide.
 *
 * Reference: https://dontkillmyapp.com/
 */

const STORAGE_KEY = 'oem_autostart_shown_v1';

export type OEMVendor = 'xiaomi' | 'oppo' | 'vivo' | 'huawei' | 'samsung' | 'other';

/**
 * Detect the OEM. Falls back to 'other' for stock Android (Pixel, Sony, etc.).
 */
export const detectOEM = (): OEMVendor => {
  if (Platform.OS !== 'android') return 'other';
  // Platform.constants.Brand / Manufacturer are exposed by RN on Android (Build.BRAND / MANUFACTURER)
  const constants = (Platform as any).constants || {};
  const brand = (constants.Brand || '').toString().toLowerCase();
  const manufacturer = (constants.Manufacturer || '').toString().toLowerCase();
  const m = `${brand} ${manufacturer}`;
  if (m.includes('xiaomi') || m.includes('redmi') || m.includes('poco')) return 'xiaomi';
  if (m.includes('oppo') || m.includes('realme') || m.includes('oneplus')) return 'oppo';
  if (m.includes('vivo') || m.includes('iqoo')) return 'vivo';
  if (m.includes('huawei') || m.includes('honor')) return 'huawei';
  if (m.includes('samsung')) return 'samsung';
  return 'other';
};

/**
 * Whether this OEM is known to aggressively kill background work.
 */
export const needsAutostartGuide = (vendor: OEMVendor): boolean => {
  return vendor === 'xiaomi' || vendor === 'oppo' || vendor === 'vivo' || vendor === 'huawei';
};

/**
 * Has the user already seen the guide on this device?
 */
export const wasAutostartGuideShown = (): boolean => {
  return storage.getBoolean(STORAGE_KEY) === true;
};

export const markAutostartGuideShown = () => {
  storage.set(STORAGE_KEY, true);
};

/**
 * Try to open the OEM-specific Autostart settings screen.
 * Falls back to general app settings if the OEM intent is not available.
 */
export const openAutostartSettings = async (vendor: OEMVendor): Promise<void> => {
  // OEM-specific intents (component names) used by browser/launcher apps to deep-link
  const intents: Record<OEMVendor, string[]> = {
    xiaomi: [
      'com.miui.securitycenter/com.miui.permcenter.autostart.AutoStartManagementActivity',
    ],
    oppo: [
      'com.coloros.safecenter/.permission.startup.StartupAppListActivity',
      'com.coloros.safecenter/.startupapp.StartupAppListActivity',
      'com.oppo.safe/.permission.startup.StartupAppListActivity',
    ],
    vivo: [
      'com.iqoo.secure/.ui.phoneoptimize.AddWhiteListActivity',
      'com.vivo.permissionmanager/.activity.BgStartUpManagerActivity',
    ],
    huawei: [
      'com.huawei.systemmanager/.startupmgr.ui.StartupNormalAppListActivity',
      'com.huawei.systemmanager/.optimize.process.ProtectActivity',
    ],
    samsung: [],
    other: [],
  };

  const candidates = intents[vendor];
  for (const component of candidates) {
    try {
      // React Native's Linking can open intent:// URIs on Android
      const url = `intent:#Intent;component=${component};end`;
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
        return;
      }
    } catch {
      // try next candidate
    }
  }

  // Fallback: open app settings
  try {
    await Linking.openSettings();
  } catch {
    // ignore — nothing else we can do
  }
};

export const getOEMInstructions = (vendor: OEMVendor): { title: string; steps: string[] } => {
  switch (vendor) {
    case 'xiaomi':
      return {
        title: 'Xiaomi / Redmi / Poco',
        steps: [
          '1. Tap "Open Settings" below',
          '2. Find "MamaAir" in the autostart list',
          '3. Toggle the switch to ON',
          '4. Return to the app — tracking will stay reliable in the background',
        ],
      };
    case 'oppo':
      return {
        title: 'OPPO / Realme / OnePlus',
        steps: [
          '1. Tap "Open Settings" below',
          '2. Find "MamaAir"',
          '3. Enable "Allow auto-start" / "Background activity"',
          '4. Return to the app',
        ],
      };
    case 'vivo':
      return {
        title: 'Vivo / iQOO',
        steps: [
          '1. Tap "Open Settings" below',
          '2. Find "MamaAir" in the auto-start list',
          '3. Enable both "High background power consumption" and "Auto-start"',
          '4. Return to the app',
        ],
      };
    case 'huawei':
      return {
        title: 'Huawei / Honor',
        steps: [
          '1. Tap "Open Settings" below',
          '2. Tap "MamaAir" → toggle off "Manage manually" then turn on Auto-launch + Run in background',
          '3. Return to the app',
        ],
      };
    default:
      return {
        title: 'Background activity',
        steps: [
          'Allow MamaAir to run in the background so air-quality tracking is not interrupted.',
        ],
      };
  }
};
