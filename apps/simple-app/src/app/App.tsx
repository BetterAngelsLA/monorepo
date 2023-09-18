import { Buffer } from 'buffer';
import {
  fetchDiscoveryAsync,
  makeRedirectUri,
  useAuthRequest,
} from 'expo-auth-session';
import * as Crypto from 'expo-crypto';
import * as WebBrowser from 'expo-web-browser';
import React, { useEffect, useState } from 'react';
import { Button, Platform, SafeAreaView, Text } from 'react-native';

WebBrowser.maybeCompleteAuthSession();

const discoveryUrl = 'https://accounts.google.com';
// const STATE_EXPIRATION_TIME = 10 * 60 * 1000; // 10 minutes in milliseconds

function base64urlEncode(data: string) {
  const base64 = Buffer.from(data).toString('base64');
  return base64.replace('+', '-').replace('/', '_').replace(/=+$/, '');
}

async function generateStatePayload(length = 32) {
  const randomBytes = await Crypto.getRandomBytes(length);
  const payload = {
    csrfToken: Buffer.from(randomBytes).toString('hex'),
    path_back: makeRedirectUri(),
    // expiresAt: Date.now() + STATE_EXPIRATION_TIME,
  };
  return base64urlEncode(JSON.stringify(payload));
}

export default function App() {
  const [discovery, setDiscovery] = useState(null);
  const [authKey, setAuthKey] = useState<string | null>(null);
  // TODO: Fix this please
  // Is this a hack, can we get rid of this approach??
  // I needed to do this so that we got around the race condition on first login
  const [generatedState, setGeneratedState] = useState<string | null>(() => {
    let state = '';
    (async () => {
      state = await generateStatePayload();
      setGeneratedState(state);
    })();
    return state;
  });

  useEffect(() => {
    (async () => {
      const discoveryData = await fetchDiscoveryAsync(discoveryUrl);
      setDiscovery(discoveryData);
    })();
  }, []);

  // TODO: this needs to be an environment variable.
  const clientId =
    '488261458560-ign54eicotm281qll13vi7gq7ps4ga3h.apps.googleusercontent.com';
  const redirectUri =
    Platform.OS === 'web'
      ? makeRedirectUri()
      : // TODO: this path needs to be an environment variable.
        'http://localhost:8000/auth-redirect';

  const [request, response, promptAsync] = useAuthRequest(
    {
      clientId,
      redirectUri,
      scopes: ['profile', 'email'],
      usePKCE: false, //TODO: Explain why we don't want to use PKCE and why it is fine
      state: generatedState, //TODO: figure out why typescript is complaining about the state
      prompt: 'select_account', //TODO: figure out why typescript is compliaing about the prompt value
    },
    discovery
  );

  useEffect(() => {
    if (response?.type === 'success') {
      const { code } = response.params;
      // TODO: Add logic to validate state with the stored/generated state and its expiration
      if (discovery && code) {
        (async () => {
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
                body: JSON.stringify({ code: code }),
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
        })();
      }
    }
  }, [response, discovery, redirectUri]);

  const handleLogin = async () => {
    await promptAsync();
  };

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
          onPress={handleLogin}
          disabled={!generatedState} // TODO: dirty hack consider another approach.
        />
      )}
    </SafeAreaView>
  );
}
