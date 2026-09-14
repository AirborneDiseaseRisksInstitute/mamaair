import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { ThemeProvider } from '../theme';
import { Navigation } from './Navigation';
import { ToastProvider } from '../components/ui/Toast';
import { useLanguageSync } from '../hooks/useLanguageSync';
import { backgroundSync } from '../services/sync/BackgroundSync';
import { MommySymptomSyncCoordinator } from '../components/recommendations/MommySymptomSyncCoordinator';

const AppInner: React.FC = () => {
  useLanguageSync();

  // Schedule periodic background location upload (while running and, via the
  // headless task registered in index.js, after the app is terminated).
  useEffect(() => {
    backgroundSync
      .init()
      .catch((e) => console.warn('[BackgroundSync] init failed', e));
  }, []);

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




