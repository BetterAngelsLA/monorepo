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

  // Define allowed platforms
  type AllowedPlatforms = 'ios' | 'android' | 'web';
  const currentPlatform = Platform.OS as AllowedPlatforms;

  // Platform-specific tokens
  const newRelicAppTokens: Record<AllowedPlatforms, string | undefined> = {
    ios: process.env.EXPO_PUBLIC_NEW_RELIC_IOS_APP_TOKEN,
    android: process.env.EXPO_PUBLIC_NEW_RELIC_ANDROID_APP_TOKEN,
    web: process.env.EXPO_PUBLIC_NEW_RELIC_WEB_APP_TOKEN,
  };

  // Retrieve the token or provide a default fallback
  const newRelicAppToken = newRelicAppTokens[currentPlatform];

  // Check if any of the environment variables are undefined
  if (
    !googleClientId ||
    !apiUrl ||
    !demoApiUrl ||
    !redirectUri ||
    !newRelicAppToken
  ) {
    throw new Error('One or more environment variables are undefined.');
  }

  return { apiUrl, demoApiUrl, googleClientId, redirectUri, newRelicAppToken };
}

const { apiUrl, demoApiUrl, googleClientId, redirectUri, newRelicAppToken } =
  loadConfig();

const privacyPolicyUrl = `${apiUrl}/legal/privacy-policy`;
const termsOfServiceUrl = `${apiUrl}/legal/terms-of-service`;

export {
  apiUrl,
  demoApiUrl,
  googleClientId,
  newRelicAppToken,
  privacyPolicyUrl,
  redirectUri,
  termsOfServiceUrl,
};
