import { createNavigationContainerRef } from '@react-navigation/native';
import type { RootStackParamList } from './Navigation';

/**
 * Standalone navigation ref so non-component modules (e.g. the axios client)
 * can drive navigation without importing the Navigation tree — which would
 * create an import cycle (client -> Navigation -> screens -> services -> client).
 */
export const navigationRef = createNavigationContainerRef<RootStackParamList>();

/**
 * Sends the user back to the auth-loading entry point (which re-checks the
 * session and forwards to the sign-in screen). Safe to call from anywhere:
 * it no-ops until the navigator is mounted.
 */
export const resetToAuthLoading = () => {
  if (navigationRef.isReady()) {
    navigationRef.reset({ index: 0, routes: [{ name: 'AuthLoading' }] });
  }
};
