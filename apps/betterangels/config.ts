// config.ts
import { makeRedirectUri } from 'expo-auth-session';
import { Platform } from 'react-native';

function loadConfig() {
  const clientId = process.env.EXPO_PUBLIC_CLIENT_ID;
  const apiUrl = process.env.EXPO_PUBLIC_API_URL;
  const redirectUri =
    Platform.OS === 'web'
      ? makeRedirectUri()
      : process.env.EXPO_PUBLIC_REDIRECT_URL;

  // Check if any of the environment variables are undefined
  if (!clientId || !apiUrl || !redirectUri) {
    throw new Error('One or more environment variables are undefined.');
  }

  return { apiUrl, clientId, redirectUri };
}

// TODO: We need to rename the cliendId and redirecturi to google namespace
const { apiUrl, clientId, redirectUri } = loadConfig();

export { apiUrl, clientId, redirectUri };
