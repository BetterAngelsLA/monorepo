import {
  AuthContainer,
  fetchUser,
  useAuthStore,
  useUser,
} from '@monorepo/expo/betterangels';
import { GoogleIcon, Windowsicon } from '@monorepo/expo/shared/icons';
import { Colors } from '@monorepo/expo/shared/static';
import { BodyText, Button, H1, H4 } from '@monorepo/expo/shared/ui-components';
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

// const discoveryUrl = 'https://accounts.google.com';
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

const magicLink = async () => {
  await fetch(`${apiUrl}/magic-auth/generate-link`, {
    method: 'POST',
  });
};

export default function SignIn() {
  const [generatedState, setGeneratedState] = useState<string | undefined>(
    undefined
  );
  const [flow, setFlow] = useState<'sign-in' | 'sign-up'>('sign-in');
  const discovery = useAutoDiscovery(discoveryUrl);
  console.log('DISCOVERY', JSON.stringify(discovery));

  const { setUser } = useUser();
  const { type } = useLocalSearchParams();
  const { setCsrfCookieFromResponse } = useAuthStore();

  useEffect(() => {
    setGeneratedState(generateStatePayload());
  }, []);

  if (!clientId || !redirectUri || !apiUrl) {
    throw new Error('env required');
  }

  console.log('redirect uri', redirectUri);

  if (type !== 'sign-up' && type !== 'sign-in') {
    throw new Error('auth param is incorrect');
  }

  // const [request, response, promptAsync] = AuthSession.useAuthRequest(
  //   {
  //     clientId,
  //     redirectUri,
  //     scopes: ['profile', 'email'],
  //     usePKCE: true,
  //     state: generatedState,
  //     prompt: AuthSession.Prompt.SelectAccount,
  //   },
  //   discovery
  // );
  const [request, response, promptAsync] = AuthSession.useAuthRequest(
    {
      clientId: '50defdba4cc82d3007c33bd73da38d50',
      // clientId: '6cafcb688f95f8bd8e19921f3f7d7f3b',
      scopes: ['profile'],
      redirectUri,
      state: generatedState,
      usePKCE: false,
      prompt: AuthSession.Prompt.Login,
      responseType: 'code',
    },
    discovery
  );

  console.log('request', request, 'response', response);

  const handleDeepLinking = useCallback(
    async (url: string | null): Promise<void> => {
      console.log('>>>>> HANDLE DEEP LINKINGI TRIGGERED', url);
      console.log('>>>>> Response', response);
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

      console.log('redirect uri', redirectUri);

      try {
        const response = await fetch(
          // `${apiUrl}/rest-auth/google/?redirect_uri=${encodeURIComponent(
          //   redirectUri
          // )}`,
          `${apiUrl}/rest-auth/idme/?redirect_uri=${encodeURIComponent(
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
        setCsrfCookieFromResponse(response);
        const userData = await fetchUser(apiUrl);
        setUser(userData);
        if (userData.hasOrganization) {
          router.replace('/');
        } else {
          router.replace('/welcome');
        }
      } catch (error) {
        console.error('Error fetching access token', error);
      }
    },
    [
      request?.codeVerifier,
      request?.state,
      response,
      setCsrfCookieFromResponse,
      setUser,
    ]
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
        <H4 textTransform="uppercase" mb="xs" color={Colors.BRAND_YELLOW}>
          {FLOW[flow].welcome}
        </H4>
        <H1
          mb="xl"
          color={Colors.BRAND_ANGEL_BLUE}
          fontSize={32}
          textTransform="uppercase"
        >
          {FLOW[flow].title}
        </H1>
        {FLOW[flow].message && (
          <BodyText mb="md" color={Colors.WHITE}>
            {FLOW[flow].message}
          </BodyText>
        )}
        <View style={{ width: '100%', marginBottom: 24 }}>
          <Button
            title="hello"
            size="full"
            variant="dark"
            onPress={async () => await magicLink()}
          />
          <Button
            mb="xs"
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
  title: {
    fontFamily: 'IBM-semibold',
    fontSize: 32,
    textTransform: 'uppercase',
    color: Colors.BRAND_ANGEL_BLUE,
    marginBottom: 56,
  },
  message: {
    fontFamily: 'Pragmatica-book',
    color: Colors.WHITE,
    fontSize: 16,
    marginBottom: 24,
  },
  question: {
    fontFamily: 'Pragmatica-book',
    color: Colors.WHITE,
    fontSize: 16,
  },
  link: {
    fontFamily: 'Pragmatica-bold',
    textDecorationLine: 'underline',
    color: Colors.BRAND_SKY_BLUE,
  },
});

export function useAutoDiscovery(
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

/**
 * {
  "issuer": "https://api.idmelabs.com/oidc",
  "authorization_endpoint": "https://api.idmelabs.com/oauth/authorize",
  "token_endpoint": "https://api.idmelabs.com/oauth/token",
  "userinfo_endpoint": "https://api.idmelabs.com/api/public/v3/userinfo",
  "jwks_uri": "https://api.idmelabs.com/oidc/.well-known/jwks",
  "scopes_supported": [
    "openid"
  ],
  "response_types_supported": [
    "code",
    "token",
    "id_token",
    "code id_token",
    "code token",
    "id_token token",
    "code id_token token"
  ],
  "grant_types_supported": [
    "authorization_code",
    "refresh_token"
  ],
  "subject_types_supported": [
    "public"
  ],
  "id_token_signing_alg_values_supported": [
    "RS256",
    "ES256"
  ],
  "id_token_encryption_alg_values_supported": [
    "RSA-OAEP"
  ],
  "id_token_encryption_enc_values_supported": [
    "A256CBC-HS512"
  ],
  "userinfo_signing_alg_values_supported": [
    "RS256",
    "ES256"
  ],
  "userinfo_encryption_alg_values_supported": [
    "RSA-OAEP"
  ],
  "userinfo_encryption_enc_values_supported": [
    "A256CBC-HS512"
  ],
  "token_endpoint_auth_methods_supported": [
    "client_secret_post",
    "client_secret_basic"
  ]
}
 */
