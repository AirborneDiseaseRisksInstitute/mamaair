import React, { useEffect } from 'react';
import { AppState, View, StyleSheet } from 'react-native';
import { ThemeProvider } from '../theme';
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
  const token = useAuthStore(state => state.token);

  // Schedule periodic background location upload (while running and, via the
  // headless task registered in index.js, after the app is terminated).
  useEffect(() => {
    backgroundSync
      .init()
      .catch(e => console.warn('[BackgroundSync] init failed', e));
  }, []);

  useEffect(() => {
    if (!token && !DEV_LOCAL_SESSION) {
      locationAccessCoordinator.resetForSignedOutSession();
      return undefined;
    }

    const resumeTracking = () => {
      locationAccessCoordinator.resume().catch(error => {
        console.warn('[LocationAccess] Failed to resume tracking', error);
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
      <MommySymptomSyncCoordinator />
      <Navigation />
    </>
  );
};

export const AppRoot: React.FC = () => {
  return (
    <ThemeProvider>
      <View style={styles.container}>
        <ToastProvider>
          <AppInner />
        </ToastProvider>
      </View>
    </ThemeProvider>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
