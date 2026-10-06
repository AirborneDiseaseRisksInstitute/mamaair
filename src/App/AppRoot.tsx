import React, { useEffect } from 'react';
import { AppState, View, StatusBar, StyleSheet } from 'react-native';
import { ThemeProvider, useTheme } from '../theme';
import { Navigation } from './Navigation';
import { ToastProvider } from '../components/ui/Toast';
import { useLanguageSync } from '../hooks/useLanguageSync';
import { backgroundSync } from '../services/sync/BackgroundSync';
import { MommySymptomSyncCoordinator } from '../components/recommendations/MommySymptomSyncCoordinator';
import { useAuthStore } from '../store/useAuthStore';
import { DEV_LOCAL_SESSION } from '../config/dev';
import { locationAccessCoordinator } from '../services/tracking/LocationAccessCoordinator';

const AppInner: React.FC = () => {
  useLanguageSync();
  const theme = useTheme();
  const token = useAuthStore(state => state.token);

  // Schedule periodic background location upload (while running and, via the
  // headless task registered in index.js, after the app is terminated).
  useEffect(() => {
    backgroundSync
      .init()
      .catch(e => {
        if (__DEV__) console.warn('[BackgroundSync] init failed', e);
      });

    return locationAccessCoordinator.addLocationListener(location => {
      if (location.state === 'Outdoor') {
        backgroundSync.scheduleSync();
      }
    });
  }, []);

  useEffect(() => {
    if (!token && !DEV_LOCAL_SESSION) {
      locationAccessCoordinator.resetForSignedOutSession();
      return undefined;
    }

    const resumeTracking = () => {
      backgroundSync
        .performSync()
        .catch(error =>
          __DEV__ &&
          console.warn('[BackgroundSync] foreground sync failed', error),
        );
      locationAccessCoordinator.resume().catch(error => {
        if (__DEV__) {
          console.warn('[LocationAccess] Failed to resume tracking', error);
        }
      });
    };

    resumeTracking();
    const subscription = AppState.addEventListener('change', state => {
      if (state === 'active') resumeTracking();
    });
    return () => subscription.remove();
  }, [token]);

  return (
    <>
      <StatusBar
        barStyle={theme.mode === 'dark' ? 'light-content' : 'dark-content'}
        backgroundColor={theme.colors.background}
      />
      <MommySymptomSyncCoordinator />
      <Navigation />
    </>
  );
};

export const AppRoot: React.FC = () => {
  return (
    <ThemeProvider>
      <AppSurface />
    </ThemeProvider>
  );
};

const AppSurface: React.FC = () => {
  const theme = useTheme();
  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ToastProvider>
        <AppInner />
      </ToastProvider>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
});
