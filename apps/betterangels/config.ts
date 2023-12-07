// config.ts
import { makeRedirectUri } from 'expo-auth-session';
import { Platform } from 'react-native';

function getEnvVariable(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Environment variable ${name} is missing`);
  }
  return value;
}

export const clientId = getEnvVariable('EXPO_PUBLIC_CLIENT_ID');
export const apiUrl = getEnvVariable('EXPO_PUBLIC_API_URL');
export const redirectUri =
  Platform.OS === 'web'
    ? makeRedirectUri()
    : getEnvVariable('EXPO_PUBLIC_REDIRECT_URL');
