import { HomeIcon } from '@monorepo/expo/shared/icons';
import { Button } from '@monorepo/expo/shared/ui-components';
import * as AuthSession from 'expo-auth-session';
import { useRouter } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { useEffect } from 'react';
import { Text, View } from 'react-native';
import useUser from '../libs/hooks/user/useUser';

WebBrowser.maybeCompleteAuthSession();

const redirectUri = AuthSession.makeRedirectUri({
  native: 'outreach://redirect',
});

const googleClientId =
  '488261458560-ign54eicotm281qll13vi7gq7ps4ga3h.apps.googleusercontent.com';

export default function SignIn() {
  const { setUser } = useUser();
  const router = useRouter();
  const discovery = AuthSession.useAutoDiscovery('https://accounts.google.com');

  const [request, response, promptAsync] = AuthSession.useAuthRequest(
    {
      clientId: googleClientId,
      redirectUri,
      scopes: ['profile', 'email'],
      responseType: 'code',
    },
    discovery
  );

  useEffect(() => {
    if (response?.type === 'success') {
      const data = response.params;
      console.log(data);
    }
  }, [response]);

  return (
    <View>
      <Text>This is sign in</Text>
      <Button title="Sign In" onPress={() => promptAsync()} />
      <HomeIcon w={40} h={40} />
    </View>
  );
}
