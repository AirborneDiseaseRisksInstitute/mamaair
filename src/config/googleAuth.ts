import { Platform } from 'react-native';

export const GOOGLE_WEB_CLIENT_IDS = {
  android:
    '716499111006-9h05fk2l76bt195t8otb5itrt8jh4gh4.apps.googleusercontent.com',
  ios: '212373353528-fe2pe6nb9i7n65gm306lsp5lno1ep68n.apps.googleusercontent.com',
} as const;

export const GOOGLE_WEB_CLIENT_ID =
  Platform.OS === 'ios'
    ? GOOGLE_WEB_CLIENT_IDS.ios
    : GOOGLE_WEB_CLIENT_IDS.android;
