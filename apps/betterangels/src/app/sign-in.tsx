import { useMutation } from '@apollo/client';
import {
  AuthContainer,
  GENERATE_MAGIC_LINK_MUTATION,
  IDME_AUTH_MUTATION,
  useSignIn,
} from '@monorepo/expo/betterangels';
import { IdMeIcon } from '@monorepo/expo/shared/icons';
import { Colors, Spacings } from '@monorepo/expo/shared/static';
import { BodyText, Button, H1, H4 } from '@monorepo/expo/shared/ui-components';
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

const discoveryUrl = 'https://api.idmelabs.com/oidc';
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
  ] = useMutation(GENERATE_MAGIC_LINK_MUTATION);
  const { signIn } = useSignIn(IDME_AUTH_MUTATION);
  const discovery = useAutoDiscoveryLocal(discoveryUrl);
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
      scopes: ['fortified_identity'],
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
      await signIn(code, request?.codeVerifier, redirectUri);
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
    } catch (error) {
      console.error('Error generating magic link:', error);
    }
  };

  if (!generatedState) {
    return <Text>Loading...</Text>;
  }

  return (
    <AuthContainer imageSource={require('./assets/images/auth-background.png')}>
      <View style={styles.container}>
        <H4 textTransform="uppercase" mb="xs" color={Colors.BRAND_YELLOW}>
          {FLOW[flow].welcome}
        </H4>
        <H1
          mb="xl"
          color={Colors.BRAND_ANGEL_BLUE}
          size="2xl"
          textTransform="uppercase"
        >
          {FLOW[flow].title}
        </H1>
        {FLOW[flow].message && (
          <BodyText mb="md" color={Colors.WHITE}>
            {FLOW[flow].message}
          </BodyText>
        )}
        <View style={{ width: '100%', marginBottom: Spacings.md }}>
          <Button
            mb="xs"
            size="full"
            title={`${FLOW[flow].link} with ID.me`}
            align="flex-start"
            icon={<IdMeIcon size="lg" />}
            fontFamily="IBM-bold"
            variant="dark"
            onPress={() => promptAsync({ showInRecents: false })}
            disabled={!generatedState && !request}
          />
          <Button
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
          <BodyText color={Colors.WHITE}>{FLOW[flow].question}</BodyText>
          <H4
            textDecorationLine="underline"
            onPress={() => setFlow(flow === 'sign-in' ? 'sign-up' : 'sign-in')}
            color={Colors.BRAND_SKY_BLUE}
          >
            {' '}
            {FLOW[flow].link}
          </H4>
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

/**
 * TODO: Temporary hold for retrieving useAutoDiscovery from expo-auth-session
 */
function useAutoDiscoveryLocal(
  issuerOrDiscovery: string
): AuthSession.DiscoveryDocument | null {
  const [discovery, setDiscovery] =
    useState<AuthSession.DiscoveryDocument | null>(null);

  useEffect(() => {
    let isAllowed = true;
    if (isAllowed) {
      setDiscovery({
        discoveryDocument: {
          issuer: 'https://api.idmelabs.com/oidc',
          authorization_endpoint: 'https://api.idmelabs.com/oauth/authorize',
          token_endpoint: 'https://api.idmelabs.com/oauth/token',
          userinfo_endpoint: 'https://api.idmelabs.com/api/public/v3/userinfo',
          jwks_uri: 'https://api.idmelabs.com/oidc/.well-known/jwks',
          scopes_supported: ['openid'],
          response_types_supported: [
            'code',
            'token',
            'id_token',
            'code id_token',
            'code token',
            'id_token token',
            'code id_token token',
          ],
          grant_types_supported: ['authorization_code', 'refresh_token'],
          subject_types_supported: ['public'],
          id_token_signing_alg_values_supported: ['RS256', 'ES256'],
          id_token_encryption_alg_values_supported: ['RSA-OAEP'],
          id_token_encryption_enc_values_supported: ['A256CBC-HS512'],
          userinfo_signing_alg_values_supported: ['RS256', 'ES256'],
          userinfo_encryption_alg_values_supported: ['RSA-OAEP'],
          userinfo_encryption_enc_values_supported: ['A256CBC-HS512'],
          token_endpoint_auth_methods_supported: [
            'client_secret_post',
            'client_secret_basic',
          ],
        },
        authorizationEndpoint: 'https://api.idmelabs.com/oauth/authorize',
        tokenEndpoint: 'https://api.idmelabs.com/oauth/token',
        revocationEndpoint: 'https://api.idmelabs.com/oauth/revoke',
        userInfoEndpoint: 'https://api.idmelabs.com/api/public/v3/userinfo',
      });
    }

    return () => {
      isAllowed = false;
    };
  }, [issuerOrDiscovery]);

  return discovery;
}
