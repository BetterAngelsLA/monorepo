import { getSessionId, useStore } from '@monorepo/expo/outreach/libs';
import { HouseIcon } from '@monorepo/expo/shared/icons';
import { Buffer } from 'buffer';
import {
  Prompt,
  makeRedirectUri,
  useAuthRequest,
  useAutoDiscovery,
} from 'expo-auth-session';
import * as Crypto from 'expo-crypto';
import * as WebBrowser from 'expo-web-browser';
import React, { useCallback, useEffect, useState } from 'react';
import { Button, Platform, SafeAreaView, Text } from 'react-native';
import { apiUrl, clientId, redirectUri } from '../../config';

WebBrowser.maybeCompleteAuthSession();

const discoveryUrl = 'https://accounts.google.com';
// const STATE_EXPIRATION_TIME = 10 * 60 * 1000; // 10 minutes in milliseconds

if (!clientId || !redirectUri) {
  throw new Error(
    'Environment variables EXPO_PUBLIC_CLIENT_ID and EXPO_PUBLIC_REDIRECT_URL are not defined'
  );
}

function base64urlEncode(data: string) {
  const base64 = Buffer.from(data).toString('base64');
  return base64.replace('+', '-').replace('/', '_').replace(/=+$/, '');
}

export default function SignIn() {
  const [generatedState, setGeneratedState] = useState<string | undefined>(
    undefined
  );
  const discovery = useAutoDiscovery(discoveryUrl);
  const { saveStore } = useStore();

  const [, response, promptAsync] = useAuthRequest(
    {
      clientId: clientId!,
      redirectUri: redirectUri!,
      scopes: ['profile', 'email'],
      usePKCE: false, //TODO: Explain why we don't want to use PKCE and why it is fine
      state: generatedState,
      prompt: Prompt.SelectAccount,
    },
    discovery
  );

  const generateStatePayload = useCallback(async (length = 32) => {
    try {
      const randomBytes = await Crypto.getRandomBytes(length);
      const payload = {
        csrfToken: Buffer.from(randomBytes).toString('hex'),
        path_back: makeRedirectUri(),
      };
      return base64urlEncode(JSON.stringify(payload));
    } catch (error) {
      console.error('Error generating state payload:', error);
      return undefined;
    }
  }, []);

  const initialize = useCallback(async () => {
    const state = await generateStatePayload();
    setGeneratedState(state);
  }, [generateStatePayload]);

  useEffect(() => {
    initialize();
  }, [initialize]);

  useEffect(() => {
    if (response?.type === 'success') {
      const { code } = response.params;
      // TODO: Add logic to validate state with the stored/generated state and its expiration
      if (discovery && code) {
        (async () => {
          try {
            const tokenResponse = await fetch(
              `${apiUrl}/rest-auth/google/?redirect_uri=${encodeURIComponent(
                redirectUri!
              )}`,
              {
                method: 'POST',
                headers: {
                  Accept: 'application/json',
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({ code: code }),
                credentials: 'include',
              }
            );

            if (Platform.OS === 'ios' || Platform.OS === 'android') {
              const setCookieHeader = tokenResponse.headers.get('set-cookie');
              if (setCookieHeader) {
                const { sessionId } = getSessionId(setCookieHeader);
                saveStore('sessionid', sessionId);
              }
            }
          } catch (error) {
            console.error('Error fetching access token', error);
          }
        })();
      }
    }
  }, [response, discovery, redirectUri]);

  const handleLogin = async () => {
    await promptAsync();
  };

  if (!generatedState) {
    return <Text>Loading...</Text>;
  }

  return (
    <SafeAreaView
      style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}
    >
      <HouseIcon color="#ffffff" size="md" />
      <Button title="Login with Google" onPress={handleLogin} />
    </SafeAreaView>
  );
}
