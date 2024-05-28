import { gql } from '@apollo/client';
import { GoogleIcon } from '@monorepo/expo/shared/icons';
import { Button } from '@monorepo/expo/shared/ui-components';
import { Buffer } from 'buffer';
import * as AuthSession from 'expo-auth-session';
import * as Crypto from 'expo-crypto';
import * as WebBrowser from 'expo-web-browser';
import { useCallback, useEffect, useState } from 'react';
import { AppState, Linking, Text } from 'react-native';
import useSignIn from '../../hooks/user/useSignIn';

export const GOOGLE_AUTH_MUTATION = gql`
  mutation GoogleAuth(
    $code: String!
    $codeVerifier: String!
    $redirectUri: String!
  ) {
    googleAuth(
      input: {
        code: $code
        code_verifier: $codeVerifier
        redirect_uri: $redirectUri
      }
    )
      @rest(
        type: "AuthResponse"
        path: "/rest-auth/google/?redirect_uri={args.input.redirect_uri}"
        method: "POST"
        bodyKey: "input"
      ) {
      status_code
    }
  }
`;

WebBrowser.maybeCompleteAuthSession();

const discoveryUrl = 'https://accounts.google.com';
const STATE_EXPIRATION_TIME = 10 * 60 * 1000; // 10 minutes in milliseconds

function base64urlEncode(data: string) {
  const base64 = Buffer.from(data).toString('base64');
  return base64.replace('+', '-').replace('/', '_').replace(/=+$/, '');
}

function generateStatePayload(length = 32) {
  const randomBytes = Crypto.getRandomBytes(length);
  const payload = {
    csrfToken: Buffer.from(randomBytes).toString('hex'),
    path_back: AuthSession.makeRedirectUri({ path: 'oauthredirect' }),
    expiresAt: Date.now() + STATE_EXPIRATION_TIME,
  };
  return base64urlEncode(JSON.stringify(payload));
}

interface GoogleSignInProps {
  clientId: string;
  redirectUri: string;
}

export function GoogleSignIn({ clientId, redirectUri }: GoogleSignInProps) {
  const { signIn } = useSignIn(GOOGLE_AUTH_MUTATION);
  const discovery = AuthSession.useAutoDiscovery(discoveryUrl);
  const [generatedState, setGeneratedState] = useState<string | undefined>(
    undefined
  );

  useEffect(() => {
    setGeneratedState(generateStatePayload());
  }, []);

  const [request, response, promptAsync] = AuthSession.useAuthRequest(
    {
      clientId,
      redirectUri,
      scopes: ['profile', 'email'],
      usePKCE: true,
      state: generatedState,
      prompt: AuthSession.Prompt.SelectAccount,
      responseType: 'code',
    },
    discovery
  );

  const handleDeepLinking = useCallback(
    async (url: string | null): Promise<void> => {
      // If no URL and no successful response, exit early.
      if (!url && (!response || response.type !== 'success')) return;

      let code;
      let state;

      // If there's a URL, check if it has a code.
      if (url) {
        const correctUrl = url.includes('#') ? url.replace('#', '?') : url;
        const urlObject = new URL(correctUrl);
        code = urlObject.searchParams.get('code');
        state = urlObject.searchParams.get('state');
      }

      // If code is still not set (meaning it wasn't in the URL), and there's a successful response, get the code from the response.
      if (!code && response && response.type === 'success') {
        code = response.params?.['code'];
        state = response.params?.['state'];
      }

      // If we still don't have a code or codeVerifier, then we can't proceed.
      if (!code || !request?.codeVerifier) return;

      // Ensure the state is not invalid or tampered with
      if (!state || state !== request?.state) {
        console.error('State is invalid. Please try logging in again.');
      } else {
        const decodedState = JSON.parse(
          Buffer.from(state, 'base64').toString('utf8')
        );
        if (decodedState.expiresAt < Date.now()) {
          console.error('State has expired. Please try logging in again.');
          return;
        }
      }
      await signIn({
        code,
        codeVerifier: request?.codeVerifier,
        redirectUri,
      });
    },
    [redirectUri, request?.codeVerifier, request?.state, response, signIn]
  );

  useEffect(() => {
    /*
      Android does not properly handle AuthSession redirects; so we work around it.
      See the following issues for detail:
      https://github.com/expo/expo/issues/12044#issuecomment-1401357869
      https://github.com/expo/expo/issues/12044#issuecomment-1431310529
    */

    if (AppState.currentState === 'active') {
      const listener = (event: { url: string }) => {
        void handleDeepLinking(event.url);
      };
      const subscription = Linking.addEventListener('url', listener);
      return () => {
        subscription.remove();
      };
    }
    return;
  }, [handleDeepLinking]);

  useEffect(() => {
    void Linking.getInitialURL().then(async (url) => handleDeepLinking(url));
  }, [handleDeepLinking, response]);

  if (!generatedState) {
    return <Text>Loading...</Text>;
  }
  return (
    <Button
      accessibilityHint="authorizes with Google"
      mb="xs"
      size="full"
      title={`Sign-in with Google`} // TODO: make this work with flow
      align="center"
      icon={<GoogleIcon size="lg" />}
      variant="dark"
      onPress={() => promptAsync({ showInRecents: false })}
      disabled={!generatedState && !request}
    />
  );
}
