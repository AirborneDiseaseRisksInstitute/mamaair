import Geolocation, { GeoPosition } from 'react-native-geolocation-service';
import notifee, { AndroidImportance } from '@notifee/react-native';
import { IndoorOutdoorClassifier } from '../logic/IndoorOutdoorClassifier';
import { databaseService } from '../database/DatabaseService';
import { Platform, PermissionsAndroid } from 'react-native';

class LocationTracker {
  private watchId: number | null = null;
  private classifier = IndoorOutdoorClassifier.getInstance();
  private listeners: ((location: { lat: number; lng: number; state: string; speed: number; accuracy: number }) => void)[] = [];

  public addListener(callback: (location: { lat: number; lng: number; state: string; speed: number; accuracy: number }) => void) {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== callback);
    };
  }

  async startTracking() {
    const hasPermission = await this.requestPermissions();
    if (!hasPermission) {
      console.warn('Location permission denied');
      return;
    }

    await this.startForegroundService();

    this.watchId = Geolocation.watchPosition(
      async (position) => {
        await this.handleNewLocation(position);
      },
      (error) => {
        console.error('Location error', error);
      },
      {
        enableHighAccuracy: true,
        distanceFilter: 10,
        interval: 5000,
        fastestInterval: 2000,
        showLocationDialog: true,
        forceRequestLocation: true,
        useSignificantChanges: false, // We want detailed updates
      }
    );
  }

  stopTracking() {
    if (this.watchId !== null) {
      Geolocation.clearWatch(this.watchId);
      this.watchId = null;
    }
    notifee.stopForegroundService();
  }

  private async handleNewLocation(position: GeoPosition) {
    const { latitude, longitude, accuracy, speed } = position.coords;
    const timestamp = position.timestamp;

    const state = await this.classifier.classify({
      latitude,
      longitude,
      accuracy,
      speed: speed || 0,
    });

    console.log(`Classified location as: ${state}`);

    if (state === 'Outdoor') {
      databaseService.insertLocation({
        latitude,
        longitude,
        accuracy,
        speed: speed || 0,
        timestamp,
        isOutdoor: 1,
      });
    }

    this.listeners.forEach((listener) =>
      listener({
        lat: latitude,
        lng: longitude,
        state,
        speed: speed || 0,
        accuracy,
      })
    );

    await this.updateNotification(latitude, longitude, state);
  }

  private async startForegroundService() {
      // Create a channel (required for Android)
      const channelId = await notifee.createChannel({
        id: 'tracker_channel',
        name: 'Location Tracker',
        importance: AndroidImportance.LOW,
      });

      // Register the service
      await notifee.displayNotification({
        id: 'tracker_notification',
        title: 'Tracker is working',
        body: 'Waiting for location...',
        android: {
          channelId,
          asForegroundService: true,
          ongoing: true,
          pressAction: {
            id: 'default',
          },
        },
      });
  }

  private async updateNotification(lat: number, lng: number, state: string) {
      await notifee.displayNotification({
        id: 'tracker_notification',
        title: 'Tracker is working',
        body: `Lat: ${lat.toFixed(4)}, Lng: ${lng.toFixed(4)} | State: ${state}`,
        android: {
          channelId: 'tracker_channel',
          asForegroundService: true,
          ongoing: true,
          onlyAlertOnce: true,
        },
      });
  }

  private async requestPermissions() {
    if (Platform.OS === 'ios') {
      const auth = await Geolocation.requestAuthorization('always');
      return auth === 'granted';
    }

    if (Platform.OS === 'android') {
      const granted = await PermissionsAndroid.requestMultiple([
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION,
        // For Android 10+
        PermissionsAndroid.PERMISSIONS.ACCESS_BACKGROUND_LOCATION, 
      ]);
      
      return (
        granted['android.permission.ACCESS_FINE_LOCATION'] === PermissionsAndroid.RESULTS.GRANTED &&
        granted['android.permission.ACCESS_BACKGROUND_LOCATION'] === PermissionsAndroid.RESULTS.GRANTED
      );
    }
    return false;
  }
}

export const locationTracker = new LocationTracker();
