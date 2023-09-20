import { makeRedirectUri } from 'expo-auth-session';
import { Platform } from 'react-native';
export const clientId = process.env.EXPO_PUBLIC_CLIENT_ID;
export const redirectUri =
  Platform.OS === 'web'
    ? makeRedirectUri()
    : process.env.EXPO_PUBLIC_REDIRECT_URL;
export const apiUrl = process.env.API_URL || 'http://localhost:8000';
