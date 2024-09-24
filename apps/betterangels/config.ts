// config.ts
import { makeRedirectUri } from 'expo-auth-session';
import { Platform } from 'react-native';

function loadConfig() {
  const googleClientId = process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID;
  const apiUrl = process.env.EXPO_PUBLIC_API_URL;
  const demoApiUrl = process.env.EXPO_PUBLIC_DEMO_API_URL;
  const redirectUri =
    Platform.OS === 'web'
      ? makeRedirectUri()
      : process.env.EXPO_PUBLIC_REDIRECT_URL;

  // Check if any of the environment variables are undefined
  if (!googleClientId || !apiUrl || !redirectUri || !demoApiUrl) {
    throw new Error('One or more environment variables are undefined.');
  }

  return { apiUrl, demoApiUrl, googleClientId, redirectUri };
}

const { apiUrl, demoApiUrl, googleClientId, redirectUri } = loadConfig();

const privacyPolicyUrl = `${apiUrl}/legal/privacy-policy`;
const termsOfServiceUrl = `${apiUrl}/legal/terms-of-service`;

export {
  apiUrl,
  demoApiUrl,
  googleClientId,
  privacyPolicyUrl,
  redirectUri,
  termsOfServiceUrl,
};
