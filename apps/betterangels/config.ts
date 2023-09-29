import { makeRedirectUri } from 'expo-auth-session';
import { Platform } from 'react-native';

function getRequiredEnvVar(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} is not defined!`);
  }
  return value;
}

export const clientId = process.env.EXPO_PUBLIC_CLIENT_ID;
// getRequiredEnvVar('EXPO_PUBLIC_CLIENT_ID');
export const redirectUri =
  Platform.OS === 'web'
    ? makeRedirectUri()
    : process.env.EXPO_PUBLIC_REDIRECT_URL;
// getRequiredEnvVar('EXPO_PUBLIC_REDIRECT_URL');
export const apiUrl = process.env.EXPO_PUBLIC_API_URL;
// getRequiredEnvVar('EXPO_PUBLIC_API_URL');
