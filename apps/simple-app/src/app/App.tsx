import { Buffer } from 'buffer';
import * as AuthSession from 'expo-auth-session';
import * as Crypto from 'expo-crypto';
import * as WebBrowser from 'expo-web-browser';
import React, { useCallback, useEffect, useState } from 'react';
import { Button, Linking, Platform, SafeAreaView, Text } from 'react-native';
WebBrowser.maybeCompleteAuthSession();

// const STATE_EXPIRATION_TIME = 10 * 60 * 1000; // 10 minutes in milliseconds

function base64urlEncode(data: string) {
  const base64 = Buffer.from(data).toString('base64');
  return base64.replace('+', '-').replace('/', '_').replace(/=+$/, '');
}

function generateStatePayload(length = 32) {
  const randomBytes = Crypto.getRandomBytes(length);
  const payload = {
    csrfToken: Buffer.from(randomBytes).toString('hex'),
    path_back: 'exp://192.168.1.123:8081',
    // expiresAt: Date.now() + STATE_EXPIRATION_TIME,
  };
  return base64urlEncode(JSON.stringify(payload));
}

export default function App() {
  const discovery = AuthSession.useAutoDiscovery('https://accounts.google.com');

  // TODO: I don't think we want to set the auth key here.  We want to use use expo secure storage
  // it does not need to be stored on web since it stores it in the cookie.
  const [authKey, setAuthKey] = useState<string | null>(null);
  // TODO: Fix this please
  // This seems to be a bad hack, can we get rid of this approach??
  // I needed to do this so that we got around the race condition on first login
  const [generatedState, setGeneratedState] = useState<string>();

  useEffect(() => {
    setGeneratedState(generateStatePayload());
  }, []);

  // TODO: this needs to be an environment variable.
  const clientId =
    '488261458560-ign54eicotm281qll13vi7gq7ps4ga3h.apps.googleusercontent.com';
  const redirectUri =
    Platform.OS === 'web'
      ? AuthSession.makeRedirectUri()
      : // TODO: this path needs to be an environment variable.
        'http://localhost:8000/auth-redirect';

  const [request, response, promptAsync] = AuthSession.useAuthRequest(
    {
      clientId,
      redirectUri,
      scopes: ['profile', 'email'],
      usePKCE: true,
      state: generatedState,
    },
    discovery
  );

  const handleDeepLinking = useCallback(
    async (url: string | null): Promise<void> => {
      // If no URL and no successful response, exit early.
      if (!url && (!response || response.type !== 'success')) return;

      let code;

      // If there's a URL, check if it has a code.
      if (url) {
        const correctUrl = url.includes('#') ? url.replace('#', '?') : url;
        const urlObject = new URL(correctUrl);
        code = urlObject.searchParams.get('code');
      }

      // If code is still not set (meaning it wasn't in the URL), and there's a successful response, get the code from the response.
      if (!code && response && response.type === 'success') {
        code = response.params?.code;
      }

      // If we still don't have a code, then we can't proceed.
      if (!code) return;
      try {
        const tokenResponse = await fetch(
          // TODO: this path needs to be an environment variable.
          `http://localhost:8000/rest-auth/google/?redirect_uri=${encodeURIComponent(
            redirectUri
          )}`,
          {
            method: 'POST',
            headers: {
              Accept: 'application/json',
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              code: code,
              code_verifier: request?.codeVerifier,
            }),
            credentials: 'include',
          }
        );
        // TODO: we only need to do this on iOS & Android
        // We actually should be storing this information in Expo Secure storage
        // We don't need to store anything on Web as the cookie is set automatically.
        setAuthKey(tokenResponse.headers.get('set-cookie'));
      } catch (error) {
        console.error('Error fetching access token', error);
      }
    },
    [redirectUri, request?.codeVerifier, response]
  );
  useEffect(() => {
    /*
      Explanation why this is needed
      Please explain more
      https://github.com/expo/expo/issues/12044#issuecomment-1401357869
      https://github.com/expo/expo/issues/12044#issuecomment-1431310529
    */
    const listener = (event: { url: string }) => {
      void handleDeepLinking(event.url);
      subscription.remove();
    };
    const subscription = Linking.addEventListener('url', listener);
    return () => {
      subscription.remove();
    };
  }, [handleDeepLinking]);

  useEffect(() => {
    void Linking.getInitialURL().then(async (url) => handleDeepLinking(url));
  }, [response, handleDeepLinking]);

  return (
    <SafeAreaView
      style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}
    >
      {authKey ? (
        <>
          <Text>Token: {authKey}</Text>
          <Button title="Logout" onPress={() => setAuthKey(null)} />
        </>
      ) : (
        <Button
          title="Login with Google"
          onPress={async () => await promptAsync()}
          disabled={!generatedState && !request} // TODO: dirty hack consider another approach.
        />
      )}
    </SafeAreaView>
  );
}
