/**
 * @format
 */

import 'react-native-get-random-values';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  AppRegistry,
  LogBox,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import notifee from '@notifee/react-native';
import BackgroundFetch from 'react-native-background-fetch';
import { name as appName } from './app.json';
import { initializeEncryptedStorage } from './src/services/storage/EncryptedStorage';

LogBox.ignoreLogs(['SafeAreaView has been deprecated']);

const loadApplication = async () => {
  await initializeEncryptedStorage();
  return require('./App').default;
};

const BootstrapApp = () => {
  const [Application, setApplication] = useState(null);
  const [initializationError, setInitializationError] = useState(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let active = true;
    setInitializationError(null);
    loadApplication()
      .then(AppComponent => {
        if (active) setApplication(() => AppComponent);
      })
      .catch(error => {
        if (active) setInitializationError(error);
      });
    return () => {
      active = false;
    };
  }, [attempt]);

  if (Application) return <Application />;

  if (initializationError) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>MamaAir</Text>
        <Text style={styles.message}>
          Secure storage is temporarily unavailable.
        </Text>
        <Text
          style={styles.retry}
          onPress={() => setAttempt(value => value + 1)}
        >
          Retry
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#FF6900" />
    </View>
  );
};

notifee.onBackgroundEvent(async event => {
  try {
    await initializeEncryptedStorage();
    const {
      handleActionReminderBackgroundEvent,
    } = require('./src/services/NotificationService');
    await handleActionReminderBackgroundEvent(event);
  } catch (error) {
    if (__DEV__)
      console.warn('[Bootstrap] Notification storage unavailable', error);
  }
});

notifee.registerForegroundService(
  () =>
    new Promise(() => {
      // Kept alive until LocationTracker calls stopForegroundService().
    }),
);

AppRegistry.registerComponent(appName, () => BootstrapApp);

// The headless wrapper initializes the encryption key before importing any
// service that opens an encrypted MMKV instance.
BackgroundFetch.registerHeadlessTask(async event => {
  try {
    await initializeEncryptedStorage();
    const {
      BackgroundSyncHeadlessTask,
    } = require('./src/services/sync/BackgroundSync');
    await BackgroundSyncHeadlessTask(event);
  } catch (error) {
    if (__DEV__)
      console.warn('[Bootstrap] Background storage unavailable', error);
    BackgroundFetch.finish(event.taskId);
  }
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    backgroundColor: '#FFFFFF',
  },
  title: {
    color: '#FF6900',
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 12,
  },
  message: {
    color: '#333333',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
  },
  retry: {
    color: '#FF6900',
    fontSize: 16,
    fontWeight: '700',
    padding: 12,
  },
});
