import { getSessionId, useStore, useUser } from '@monorepo/expo/outreach/libs';
import { HouseIcon } from '@monorepo/expo/shared/icons';
import { Buffer } from 'buffer';
import * as AuthSession from 'expo-auth-session';
import { useAutoDiscovery } from 'expo-auth-session';
import * as Crypto from 'expo-crypto';
import { router, useNavigation } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import React, { useCallback, useEffect, useState } from 'react';
import { Button, Linking, Platform, SafeAreaView, Text } from 'react-native';
import { apiUrl, clientId, redirectUri } from '../../config';

WebBrowser.maybeCompleteAuthSession();

const discoveryUrl = 'https://accounts.google.com';
// const STATE_EXPIRATION_TIME = 10 * 60 * 1000; // 10 minutes in milliseconds

function base64urlEncode(data: string) {
  const base64 = Buffer.from(data).toString('base64');
  return base64.replace('+', '-').replace('/', '_').replace(/=+$/, '');
}

function generateStatePayload(length = 32) {
  const randomBytes = Crypto.getRandomBytes(length);
  const payload = {
    csrfToken: Buffer.from(randomBytes).toString('hex'),
    path_back: AuthSession.makeRedirectUri({ path: 'oauthredirect' }),
    // expiresAt: Date.now() + STATE_EXPIRATION_TIME,
  };
  return base64urlEncode(JSON.stringify(payload));
}

export default function SignIn() {
  const [generatedState, setGeneratedState] = useState<string | undefined>(
    undefined
  );
  const discovery = useAutoDiscovery(discoveryUrl);
  const { saveStore } = useStore();
  const { getState } = useNavigation();
  const { setUser } = useUser();
  const [authKey, setAuthKey] = useState<string | null>(null);

  useEffect(() => {
    setGeneratedState(generateStatePayload());
  }, []);

  if (!clientId || !redirectUri) {
    throw new Error(
      'Environment variables EXPO_PUBLIC_CLIENT_ID and EXPO_PUBLIC_REDIRECT_URL are not defined'
    );
  }

  const [request, response, promptAsync] = AuthSession.useAuthRequest(
    {
      clientId,
      redirectUri,
      scopes: ['profile', 'email'],
      usePKCE: true,
      state: generatedState,
      prompt: AuthSession.Prompt.SelectAccount,
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
      if (!code || !redirectUri) return;
      try {
        const tokenResponse = await fetch(
          `${apiUrl}/rest-auth/google/?redirect_uri=${encodeURIComponent(
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

        if (Platform.OS === 'ios' || Platform.OS === 'android') {
          const setCookieHeader = tokenResponse.headers.get('set-cookie');
          if (setCookieHeader) {
            const { sessionId } = getSessionId(setCookieHeader);
            setAuthKey(sessionId);
            saveStore('sessionid', sessionId);
            setUser({ id: sessionId });
            router.replace('/');
          }
        }
      } catch (error) {
        console.error('Error fetching access token', error);
      }
    },
    [getState, redirectUri, request?.codeVerifier, response]
  );

  useEffect(() => {
    /*
      Explanation why this is neede
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

  if (!generatedState) {
    return <Text>Loading...</Text>;
  }

  return (
    <SafeAreaView
      style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}
    >
      <HouseIcon color="#ffffff" size="md" />
      {authKey ? (
        <>
          <Text>Token: {authKey}</Text>
          <Button title="Logout" onPress={() => setAuthKey(null)} />
        </>
      ) : (
        <Button
          title="Login with Google"
          onPress={() => promptAsync({ showInRecents: false })}
          disabled={!generatedState && !request} // TODO: dirty hack consider another approach.
        />
      )}
    </SafeAreaView>
  );
}
