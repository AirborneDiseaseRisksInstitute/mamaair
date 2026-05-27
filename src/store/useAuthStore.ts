import { create } from 'zustand';
import { createMMKV } from 'react-native-mmkv';
import notifee from '@notifee/react-native';
import { useUserStore } from './useUserStore';
import { locationTracker } from '../services/tracking/LocationTracker';

export const storage = createMMKV();

interface AuthState {
  token: string | null;
  refreshToken: string | null;
  setToken: (token: string) => void;
  setRefreshToken: (token: string) => void;
  setTokens: (accessToken: string, refreshToken: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  token: storage.getString('auth_token') || null,
  refreshToken: storage.getString('auth_refresh_token') || null,
  setToken: (token) => {
    storage.set('auth_token', token);
    set({ token });
  },
  setRefreshToken: (token) => {
    storage.set('auth_refresh_token', token);
    set({ refreshToken: token });
  },
  setTokens: (accessToken, refreshToken) => {
    storage.set('auth_token', accessToken);
    storage.set('auth_refresh_token', refreshToken);
    set({ token: accessToken, refreshToken });
  },
  logout: () => {
    // Stop location tracking + foreground service (cancelNotification alone keeps FGS alive)
    locationTracker.stopTracking();
    notifee.stopForegroundService().catch(() => {});
    notifee.cancelNotification('tracker_notification').catch(() => {});

    storage.remove('auth_token');
    storage.remove('auth_refresh_token');
    set({ token: null, refreshToken: null });
    useUserStore.getState().clearUser();
  },
}));
