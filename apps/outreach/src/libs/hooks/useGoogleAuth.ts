import * as AuthSession from 'expo-auth-session';
import getGoogleAuthBody from '../helper/getGoogleAuthBody';
import { googleAuthConfig } from '../static/config';

const tokenEndpoint = 'https://oauth2.googleapis.com/token';
const useProxy = true;
const redirectUri = AuthSession.makeRedirectUri({
  useProxy,
});

export default function useGoogleAuth() {
  const discovery = AuthSession.useAutoDiscovery('https://accounts.google.com');

  const [request, response, promptAsync] = AuthSession.useAuthRequest(
    {
      clientId: googleAuthConfig.googleClientId,
      redirectUri,
      scopes: ['profile', 'email'],
      responseType: 'code',
    },
    discovery
  );

  const fetchAccessToken = async (code: string) => {
    try {
      const response = await fetch(tokenEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: getGoogleAuthBody(
          code,
          googleAuthConfig.googleClientId,
          redirectUri
        ),
      });
      const data = await response.json();
      return data.access_token;
    } catch (error) {
      console.error('Error fetching access token', error);
    }
  };

  return {
    request,
    response,
    promptAsync,
    fetchAccessToken,
  };
}
