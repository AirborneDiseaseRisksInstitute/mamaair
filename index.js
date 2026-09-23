/**
 * @format
 */

import { AppRegistry, LogBox } from 'react-native';
import notifee from '@notifee/react-native';
import BackgroundFetch from 'react-native-background-fetch';
import App from './App';
import { name as appName } from './app.json';
import { BackgroundSyncHeadlessTask } from './src/services/sync/BackgroundSync';
import { registerActionReminderBackgroundHandler } from './src/services/NotificationService';

LogBox.ignoreLogs([
  'SafeAreaView has been deprecated',
]);

registerActionReminderBackgroundHandler();
notifee.registerForegroundService(
  () =>
    new Promise(() => {
      // Kept alive until LocationTracker calls stopForegroundService().
    }),
);
AppRegistry.registerComponent(appName, () => App);

// Headless task: lets background location upload run even after the app is
// terminated (stopOnTerminate:false / enableHeadless:true in BackgroundSync).
// Must be registered at the top level, outside any component.
BackgroundFetch.registerHeadlessTask(BackgroundSyncHeadlessTask);
