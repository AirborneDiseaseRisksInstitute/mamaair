/**
 * @format
 */

import { AppRegistry } from 'react-native';
import BackgroundFetch from 'react-native-background-fetch';
import notifee, { EventType } from '@notifee/react-native';
import App from './App';
import { name as appName } from './app.json';
import { BackgroundSyncHeadlessTask } from './src/services/sync/BackgroundSync';

// Handle notification events when app is in background/killed
notifee.onBackgroundEvent(async ({ type, detail }) => {
  if (type === EventType.PRESS) {
    // User tapped the notification — app will open naturally
    console.log('[Notifee] Background press:', detail.notification?.id);
  }
  if (type === EventType.DISMISSED) {
    console.log('[Notifee] Background dismiss:', detail.notification?.id);
  }
});

AppRegistry.registerComponent(appName, () => App);
BackgroundFetch.registerHeadlessTask(BackgroundSyncHeadlessTask);
