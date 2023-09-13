import { Platform } from 'react-native';

export const googleAuthConfig = {
  googleClientId: Platform.select({
    ios: process.env.EXPO_PUBLIC_IOS_CLIENT_ID,
    android: process.env.EXPO_PUBLIC_ANDROID_CLIENT_ID,
    web: process.env.EXPO_PUBLIC_WEB_CLIENT_ID,
  }),
  webClientSecret: process.env.EXPO_PUBLIC_WEB_CLIENT_SECRET,
};
