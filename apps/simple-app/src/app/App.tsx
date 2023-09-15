import { Buffer } from 'buffer';
import {
  fetchDiscoveryAsync,
  makeRedirectUri,
  useAuthRequest,
} from 'expo-auth-session';
import * as Crypto from 'expo-crypto';
import * as WebBrowser from 'expo-web-browser';
import React, { useState } from 'react';
import { Button, SafeAreaView, Text } from 'react-native';
WebBrowser.maybeCompleteAuthSession();

const discoveryUrl = 'https://accounts.google.com';
// Function to generate a secure CSRF token
function generateSecureToken(length = 32) {
  const randomBytes = Crypto.getRandomBytes(length);
  return Buffer.from(randomBytes).toString('hex');
}

export default function App() {
  // Fetch the discovery
  const [discovery, setDiscovery] = useState(null);
  const fetchDiscovery = async () => {
    try {
      const result = await fetchDiscoveryAsync(discoveryUrl);
      setDiscovery(result);
    } catch (error) {
      console.error('Error fetching the discovery document', error);
    }
  };

  const statePayload = {
    csrfToken: generateSecureToken(),
    path_back: makeRedirectUri(),
  };

  const clientId =
    '488261458560-ign54eicotm281qll13vi7gq7ps4ga3h.apps.googleusercontent.com';
  const [request, , promptAsync] = useAuthRequest(
    {
      clientId,
      redirectUri: 'http://localhost:8000/auth-redirect',
      scopes: ['profile', 'email'],
      state: encodeURIComponent(JSON.stringify(statePayload)),
      prompt: 'select_account' as any, // This line prompts the user for account selection
    },
    discovery
  );

  // State to store token
  const [token, setToken] = useState(null);

  // Function to trigger the auth flow
  const handleLogin = async () => {
    if (!request) return;

    const result = await promptAsync();
    if (result.type === 'success') {
      setToken(result.params.access_token);
    }
  };

  const handleLogout = async () => {
    // Clear token from local state
    setToken(null);
  };

  // Initially fetch the discovery document
  React.useEffect(() => {
    fetchDiscovery();
  }, []);

  return (
    <SafeAreaView
      style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}
    >
      <Text> fftawft </Text>

      {token ? (
        <>
          <Text>Token: {token}</Text>
          <Button title="Logout" onPress={handleLogout} />
        </>
      ) : (
        <Button title="Login with Google" onPress={handleLogin} />
      )}
    </SafeAreaView>
  );
}
