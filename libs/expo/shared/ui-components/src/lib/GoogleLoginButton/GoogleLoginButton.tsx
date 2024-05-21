import { GoogleIcon } from '@monorepo/expo/shared/icons';
import { Buffer } from 'buffer';
import {
  makeRedirectUri,
  useAuthRequest,
  useAutoDiscovery,
} from 'expo-auth-session';
import * as Crypto from 'expo-crypto';
import * as WebBrowser from 'expo-web-browser';
import React, { useCallback, useEffect, useState } from 'react';
import { AppState, Linking, StyleSheet, View } from 'react-native';
import { Button } from '../Button/Button';
import { useLoginWithGoogleMutation } from './__generated__/Mutations.generated';
WebBrowser.maybeCompleteAuthSession();

const base64urlEncode = (data: string) => {
  const base64 = Buffer.from(data).toString('base64');
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
};

function generateStatePayload(length = 32) {
  const randomBytes = Crypto.getRandomBytes(length);
  const payload = {
    csrfToken: Buffer.from(randomBytes).toString('hex'),
    path_back: makeRedirectUri({ path: 'oauthredirect' }),
  };
  return base64urlEncode(JSON.stringify(payload));
}

// export const IDME_AUTH_MUTATION = gql`
//   mutation IdmeAuth(
//     $code: String!
//     $codeVerifier: String!
//     $redirectUri: String!
//   ) {
//     idmeAuth(
//       input: {
//         code: $code
//         code_verifier: $codeVerifier
//         redirect_uri: $redirectUri
//       }
//     )
//       @rest(
//         type: "AuthResponse"
//         path: "/rest-auth/idme/?redirect_uri={args.input.redirect_uri}"
//         method: "POST"
//         bodyKey: "input"
//       ) {
//       status_code
//     }
//   }
// `;

// export const GOOGLE_AUTH_MUTATION = gql`
//   mutation GoogleAuth(
//     $code: String!
//     $codeVerifier: String!
//     $redirectUri: String!
//   ) {
//     googleAuth(
//       input: {
//         code: $code
//         code_verifier: $codeVerifier
//         redirect_uri: $redirectUri
//       }
//     )
//       @rest(
//         type: "AuthResponse"
//         path: "/rest-auth/google/?redirect_uri={args.input.redirect_uri}"
//         method: "POST"
//         bodyKey: "input"
//       ) {
//       status_code
//     }
//   }
// `;

export const GoogleLoginButton: React.FC<{
  flow: string;
  googleClientId: string;
  redirectUri: string;
}> = ({ flow, googleClientId, redirectUri }) => {
  const [loginWithGoogle, { data, loading, error }] =
    useLoginWithGoogleMutation();
  const discovery = useAutoDiscovery('https://accounts.google.com');
  const [isProcessing, setIsProcessing] = useState(false); // Track if login is processing
  const [state, setState] = useState('');
  //   const { storeUserData } = useAuth();
  console.log(flow, googleClientId, redirectUri);
  useEffect(() => {
    setState(generateStatePayload());
  }, []);

  const [request, response, promptAsync] = useAuthRequest(
    {
      clientId: googleClientId,
      redirectUri: redirectUri,
      scopes: ['profile', 'email'],
      state: state,
      responseType: 'code',
      usePKCE: true,
    },
    discovery
  );

  const handleDeepLinking = useCallback(
    async (url: string | null): Promise<void> => {
      let code;
      let state;
      if (url) {
        const correctUrl = url.includes('#') ? url.replace('#', '?') : url;
        const urlObject = new URL(correctUrl);
        code = urlObject.searchParams.get('code');
        state = urlObject.searchParams.get('state');
      }

      if (!code && response && response.type === 'success') {
        code = response.params?.code;
        state = response.params?.state;
      }

      if (!code || !state || !request?.codeVerifier || state !== request?.state)
        return;

      await loginWithGoogle({
        variables: {
          input: {
            provider: 'google-oauth2-pkce',
            code: code,
            redirect_uri: request?.redirectUri,
            code_verifier: request?.codeVerifier || '',
          },
        },
      });
    },
    [
      loginWithGoogle,
      request?.codeVerifier,
      request?.redirectUri,
      request?.state,
      response,
    ]
  );

  useEffect(() => {
    // Sigh... need to check on these
    // https://github.com/expo/expo/issues/12044#issuecomment-1401357869
    // https://github.com/expo/expo/issues/12044#issuecomment-1431310529
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
    if (isProcessing && data && data.socialLogin) {
      setIsProcessing(false); // Set processing state when the login is initiated
      //   storeUserData(data.socialLogin);
    } else if (error) {
      setIsProcessing(false); // Set processing state when the login is initiated
    }
  }, [data, error, isProcessing]);

  const handlePress = () => {
    setIsProcessing(true); // Set processing state when the login is initiated
    promptAsync();
  };

  return (
    <View style={styles.container}>
      <Button
        accessibilityHint="authorizes with idme"
        mb="xs"
        size="full"
        title={`${flow} with Google`}
        align="center"
        icon={<GoogleIcon size="lg" />}
        variant="dark"
        onPress={() => handlePress()}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  button: {
    padding: 10,
    backgroundColor: '#0F9D58',
    borderRadius: 5,
  },
  text: {
    color: '#fff',
  },
});
