import {
  AuthContainer,
  GOOGLE_AUTH_MUTATION,
  useGenerateMagicLinkMutation,
  useSignIn,
} from '@monorepo/expo/betterangels';
import { GoogleIcon } from '@monorepo/expo/shared/icons';
import { Colors, Spacings } from '@monorepo/expo/shared/static';
import {
  Button,
  TextBold,
  TextRegular,
} from '@monorepo/expo/shared/ui-components';
import { Buffer } from 'buffer';
import * as AuthSession from 'expo-auth-session';
import * as Crypto from 'expo-crypto';
import { useLocalSearchParams } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import React, { useCallback, useEffect, useState } from 'react';
import { AppState, Linking, StyleSheet, Text, View } from 'react-native';
import { clientId, redirectUri } from '../../config';

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
  const [
    generateMagicLink,
    { data: magicLinkData, loading: magicLinkLoading, error: magicLinkError },
  ] = useGenerateMagicLinkMutation();
  const { signIn } = useSignIn(GOOGLE_AUTH_MUTATION);
  const discovery = AuthSession.useAutoDiscovery(discoveryUrl);
  const { type } = useLocalSearchParams();
  useEffect(() => {
    setGeneratedState(generateStatePayload());
  }, []);

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
        code = response.params?.code;
        state = response.params?.state;
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
        variables: {
          code: code,
          codeVerifier: request?.codeVerifier,
          redirectUri: redirectUri,
        },
      });
    },
    [request?.codeVerifier, request?.state, response, signIn]
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
  }, [handleDeepLinking, response]);

  useEffect(() => {
    setFlow(type);
  }, [type]);

  const handleGenerateMagicLink = async () => {
    try {
      await generateMagicLink();
    } catch (err) {
      console.error('Error generating magic link:', err);
    }
  };

  if (!generatedState) {
    return <Text>Loading...</Text>;
  }

  return (
    <AuthContainer imageSource={require('./assets/images/auth-background.png')}>
      <View style={styles.container}>
        <TextBold textTransform="uppercase" mb="xs" color={Colors.BRAND_YELLOW}>
          {FLOW[flow].welcome}
        </TextBold>
        <TextBold
          mb="xl"
          color={Colors.BRAND_ANGEL_BLUE}
          size="2xl"
          textTransform="uppercase"
        >
          {FLOW[flow].title}
        </TextBold>
        {FLOW[flow].message && (
          <TextRegular mb="md" color={Colors.WHITE}>
            {FLOW[flow].message}
          </TextRegular>
        )}
        <View style={{ width: '100%', marginBottom: Spacings.md }}>
          <Button
            accessibilityHint="authorizes with Google"
            mb="xs"
            size="full"
            title={`${FLOW[flow].link} with Google`}
            align="center"
            icon={<GoogleIcon size="lg" />}
            variant="dark"
            onPress={() => promptAsync({ showInRecents: false })}
            disabled={!generatedState && !request}
          />
          <Button
            accessibilityHint="send magic link for forgotten password"
            mb="xs"
            title="Generate Magic Link"
            size="full"
            variant="dark"
            onPress={handleGenerateMagicLink}
            disabled={magicLinkLoading}
          />
          {magicLinkError && (
            <Text>Error occurred: {magicLinkError.message}</Text>
          )}
          {magicLinkData && <Text>Magic Link Generated Successfully</Text>}
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <TextRegular color={Colors.WHITE}>{FLOW[flow].question}</TextRegular>
          <TextBold
            textDecorationLine="underline"
            onPress={() => setFlow(flow === 'sign-in' ? 'sign-up' : 'sign-in')}
            color={Colors.BRAND_SKY_BLUE}
          >
            {' '}
            {FLOW[flow].link}
          </TextBold>
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
});
