import { Buffer } from 'buffer';
import * as AuthSession from 'expo-auth-session';
import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';
import React, { useEffect, useState } from 'react';
import { Button, Pressable, SafeAreaView, Text } from 'react-native';
WebBrowser.maybeCompleteAuthSession();

const discoveryUrl = 'https://accounts.google.com';
// const STATE_EXPIRATION_TIME = 10 * 60 * 1000; // 10 minutes in milliseconds

function base64urlEncode(data: string) {
  const base64 = Buffer.from(data).toString('base64');
  return base64.replace('+', '-').replace('/', '_').replace(/=+$/, '');
}

function extractCodeFromURL(urlString) {
  const findParameterValue = (paramName, string) => {
    const match = string.match(new RegExp(`${paramName}=([^&]*)`));
    return match ? decodeURIComponent(match[1]) : null;
  };

  // First, check if code is directly in the urlString
  const directCode = findParameterValue('code', urlString);
  if (directCode) return directCode;

  // If not, check inside the 'url' parameter
  const innerUrl = findParameterValue('url', urlString);
  if (!innerUrl) return null;

  return findParameterValue('code', innerUrl);
}

// async function generateStatePayload(length = 32) {
//   const randomBytes = await Crypto.getRandomBytes(length);
//   const payload = {
//     csrfToken: Buffer.from(randomBytes).toString('hex'),
//     path_back: AuthSession.makeRedirectUri({
//       // path: 'oauthredirect',
//       // native: `${Application.applicationId}:/oauthredirect`,
//       native: 'http://localhost:8000/auth-redirect',
//       // native: 'com.paulbetterangels.simpleapp://',
//     }),
//     // expiresAt: Date.now() + STATE_EXPIRATION_TIME,
//   };
//   console.log(`Generating state: ${payload.path_back}`);
//   return base64urlEncode(JSON.stringify(payload));
// }
export default function App() {
  // const [discovery, setDiscovery] = useState(null);
  const discovery = AuthSession.useAutoDiscovery(discoveryUrl);
  // TODO: I don't think we want to set the auth key here.  We want to use use expo secure storage
  // it does not need to be stored on web since it stores it in the cookie.
  const [authKey, setAuthKey] = useState<string | null>(null);
  // TODO: Fix this please
  // This seems to be a bad hack, can we get rid of this approach??
  // I needed to do this so that we got around the race condition on first login
  // const [generatedState, setGeneratedState] = useState<string | null>(() => {
  //   let state = '';
  //   (async () => {
  //     state = await generateStatePayload();
  //     setGeneratedState(state);
  //   })();
  //   return state;
  // });

  // TODO: this needs to be an environment variable.
  const clientId =
    '488261458560-ign54eicotm281qll13vi7gq7ps4ga3h.apps.googleusercontent.com';
  // '488261458560-ign54eicotm281qll13vi7gq7ps4ga3h.apps.googleusercontent.com';
  // const redirectUri =
  //   Platform.OS === 'web'
  //     ? AuthSession.makeRedirectUri()
  //     : // TODO: this path needs to be an environment variable.
  //       'http://localhost:8000/oauthredirect';

  const redirectUri = AuthSession.makeRedirectUri({
    // scheme: 'com.paulbetterangels.simpleapp',
    // scheme: 'http://localhost:8000',
    native: 'http://localhost:8000/oauthredirect',
  });

  React.useEffect(() => {
    // Listen for incoming links
    const handleUrl = (event) => {
      const { url, resolve } = event;
      // Handle the URL (e.g., extract token)
      const code = extractCodeFromURL(url);
      console.log(url);
      console.log(code);
      (async () => {
        try {
          const tokenResponse = await fetch(
            // TODO: this path needs to be an environment variable.
            `http://localhost:8000/rest-auth/google/`,
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
          console.log('COOKIIEEEESSS??');
          console.log(tokenResponse.headers);

          // TODO: we only need to do this on iOS & Android
          // We actually should be storing this information in Expo Secure storage
          // We don't need to store anything on Web as the cookie is set automatically.
          setAuthKey(tokenResponse.headers.get('set-cookie'));
        } catch (error) {
          console.error('Error fetching access token', error);
        }
      })();
    };

    // Set up Linking event listener
    Linking.addEventListener('url', handleUrl);

    // Handle the case where the app is launched from a deep link
    Linking.getInitialURL().then((url) => {
      if (url) {
        console.log('deeplink');
        handleUrl({ url });
      }
    });

    // Cleanup on unmount
    return () => {
      Linking.removeEventListener('url', handleUrl);
    };
  }, []);

  const [request, response, promptAsync] = AuthSession.useAuthRequest(
    {
      clientId,
      redirectUri: redirectUri,
      scopes: ['profile', 'email'],
      // responseType: 'code',
      usePKCE: false, //TODO: Explain why we don't want to use PKCE and why it is fine
      prompt: 'select_account', //TODO: figure out why typescript is compliaing about the prompt value
      // state: generatedState,
    },
    discovery
  );

  useEffect(() => {
    console.log('========= Use Effect ==============');
    console.log(response);
    // console.log(redirectUri);
    // console.log(makeRedirectUri());

    if (response?.type === 'success') {
      const { code } = response.params;
      // TODO: Add logic to validate state with the stored/generated state and its expiration
      console.log('bloaftawf');
      if (discovery && code) {
        console.log(code);
        // (async () => {
        //   try {
        //     const tokenResponse = await fetch(
        //       // TODO: this path needs to be an environment variable.
        //       `http://localhost:8000/rest-auth/google/?redirect_uri=${encodeURIComponent(
        //         redirectUri
        //       )}`,
        //       {
        //         method: 'POST',
        //         headers: {
        //           Accept: 'application/json',
        //           'Content-Type': 'application/json',
        //         },
        //         body: JSON.stringify({ code: code }),
        //         credentials: 'include',
        //       }
        //     );
        //     // TODO: we only need to do this on iOS & Android
        //     // We actually should be storing this information in Expo Secure storage
        //     // We don't need to store anything on Web as the cookie is set automatically.
        //     setAuthKey(tokenResponse.headers.get('set-cookie'));
        //   } catch (error) {
        //     console.error('Error fetching access token', error);
        //   }
        // })();
      }
    }
  }, [response, discovery]);

  const handleLogin = async () => {
    const t = await promptAsync();
    console.log(t);
  };

  const handleLogout = async () => {
    // Clear local session
    setAuthKey(null);

    // Open Google's logout URL to clear Google session
    await WebBrowser.openBrowserAsync('https://accounts.google.com/Logout');
  };

  return (
    <SafeAreaView
      style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}
    >
      <>
        <Text>Token: {authKey}</Text>
        <Button title="Logout" onPress={handleLogout} />
      </>
      <Pressable onPress={() => request && promptAsync()}>
        <Text>SignIN</Text>
      </Pressable>
    </SafeAreaView>
  );
}
