import {
  AuthContainer,
  fetchUser,
  useStore,
  useUser,
} from '@monorepo/expo/betterangels';
import { GoogleIcon, Windowsicon } from '@monorepo/expo/shared/icons';
import { colors } from '@monorepo/expo/shared/static';
import { Button, H1, H4, P } from '@monorepo/expo/shared/ui-components';
import { Buffer } from 'buffer';
import * as AuthSession from 'expo-auth-session';
import * as Crypto from 'expo-crypto';
import { router, useLocalSearchParams } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import React, { useCallback, useEffect, useState } from 'react';
import { AppState, Linking, StyleSheet, Text, View } from 'react-native';
import { apiUrl, clientId, redirectUri } from '../../config';

type TAuthFLow = {
  [key in 'sign-in' | 'sign-up']: {
    welcome: string;
    title: string;
    message: string | null;
    question: string;
    link: string;
  };
};

const FLOW: TAuthFLow = {
  'sign-in': {
    welcome: 'WELCOME BACK!',
    title: 'SIGN IN',
    message: null,
    question: "Don't have an account?",
    link: 'Sign up',
  },
  'sign-up': {
    welcome: 'WELCOME!',
    title: 'SIGN UP',
    message:
      'If you work as a case manager or health professional, please use your work email to sign up the first time.',
    question: 'Already have an account?',
    link: 'Sign in',
  },
};

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

export default function SignIn() {
  const [generatedState, setGeneratedState] = useState<string | undefined>(
    undefined
  );
  const [flow, setFlow] = useState<'sign-in' | 'sign-up'>('sign-in');
  const discovery = AuthSession.useAutoDiscovery(discoveryUrl);
  const { saveStore } = useStore();
  const { setUser } = useUser();
  const { type } = useLocalSearchParams();

  useEffect(() => {
    setGeneratedState(generateStatePayload());
  }, []);

  if (!clientId || !redirectUri || !apiUrl) {
    throw new Error('env required');
  }

  if (type !== 'sign-up' && type !== 'sign-in') {
    throw new Error('auth param is incorrect');
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
        code = response.params?.code;
        state = response.params?.state;
      }

      // If we still don't have a code, then we can't proceed.
      if (!code || !redirectUri) return;

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

      try {
        await fetch(
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

        const userData = await fetchUser(apiUrl);
        console.log('user data: ', userData);
        setUser(userData);
        router.replace('/');
      } catch (error) {
        console.error('Error fetching access token', error);
      }
    },
    [request?.codeVerifier, request?.state, response, saveStore, setUser]
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
  }, [handleDeepLinking]);

  useEffect(() => {
    void Linking.getInitialURL().then(async (url) => handleDeepLinking(url));
  }, [response]);

  useEffect(() => {
    setFlow(type);
  }, [type]);

  if (!generatedState) {
    return <Text>Loading...</Text>;
  }

  return (
    <AuthContainer imageSource={require('./assets/images/auth-background.png')}>
      <View style={styles.container}>
        <H4 textTransform="uppercase" mb={8} color={colors.brandYellow}>
          {FLOW[flow].welcome}
        </H4>
        <H1
          mb={56}
          color={colors.brandAngelBlue}
          fontSize={32}
          textTransform="uppercase"
        >
          {FLOW[flow].title}
        </H1>
        {FLOW[flow].message && (
          <P mb={24} color={colors.white}>
            {FLOW[flow].message}
          </P>
        )}
        <View style={{ width: '100%', marginBottom: 24 }}>
          <Button
            mb={8}
            title={`${FLOW[flow].link} with Microsoft`}
            disabled
            icon={<Windowsicon size="sm" />}
            fontFamily="IBM-bold"
            size="full"
            variant="dark"
            align="flex-start"
            onPress={() => promptAsync({ showInRecents: false })}
          />
          <Button
            size="full"
            title={`${FLOW[flow].link} with Google`}
            align="flex-start"
            icon={<GoogleIcon size="sm" />}
            fontFamily="IBM-bold"
            variant="dark"
            onPress={() => promptAsync({ showInRecents: false })}
            disabled={!generatedState && !request}
          />
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <P color={colors.white}>{FLOW[flow].question}</P>
          <P
            color={colors.brandLightBlue}
            textDecorationLine="underline"
            onPress={() => setFlow(flow === 'sign-in' ? 'sign-up' : 'sign-in')}
          >
            {' '}
            {FLOW[flow].link}
          </P>
        </View>
      </View>
    </AuthContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingTop: 170,
    flex: 1,
  },
  title: {
    fontFamily: 'IBM-semibold',
    fontSize: 32,
    textTransform: 'uppercase',
    color: colors.brandAngelBlue,
    marginBottom: 56,
  },
  message: {
    fontFamily: 'Pragmatica-book',
    color: colors.white,
    fontSize: 16,
    marginBottom: 24,
  },
  question: {
    fontFamily: 'Pragmatica-book',
    color: colors.white,
    fontSize: 16,
  },
  link: {
    fontFamily: 'Pragmatica-bold',
    textDecorationLine: 'underline',
    color: colors.brandLightBlue,
  },
});
