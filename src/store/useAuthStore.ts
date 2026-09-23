import { create } from 'zustand';
import { createMMKV } from 'react-native-mmkv';
import { useUserStore } from './useUserStore';
import { AuthService } from '../services/api/AuthService';
import { markInitialLanguagePromptSeen } from '../utils/initialLanguagePrompt';

export const storage = createMMKV();

interface AuthState {
  token: string | null;
  refreshToken: string | null;
  setToken: (token: string) => void;
  setRefreshToken: (token: string) => void;
  setTokens: (accessToken: string, refreshToken: string) => void;
  clearSession: () => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
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
  clearSession: () => {
    // This preference belongs to the app installation, not the user session.
    markInitialLanguagePromptSeen();
    storage.remove('auth_token');
    storage.remove('auth_refresh_token');
    set({ token: null, refreshToken: null });
    useUserStore.getState().clearUser();
  },
  logout: () => {
    const refresh = storage.getString('auth_refresh_token');
    if (refresh) {
      // fire-and-forget: blacklist token on server, don't block local logout
      AuthService.logout(refresh).catch(() => {});
    }
    get().clearSession();
  },
}));
