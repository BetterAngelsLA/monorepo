import * as AuthSession from 'expo-auth-session';
import { useRouter } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { useEffect } from 'react';
import { Platform, Pressable, StyleSheet } from 'react-native';
import useUser from '../../libs/hooks/user/useUser';
import EditScreenInfo from '../components/EditScreenInfo';
import { Text, View } from '../components/Themed';

WebBrowser.maybeCompleteAuthSession();

const useProxy = true;
const redirectUri = AuthSession.makeRedirectUri({
  useProxy,
});

const googleClientId = Platform.select({
  ios: process.env.EXPO_PUBLIC_IOS_CLIENT_ID,
  android: process.env.EXPO_PUBLIC_ANDROID_CLIENT_ID,
  web: process.env.EXPO_PUBLIC_WEB_CLIENT_ID,
});

const body = Platform.select({
  ios: process.env.EXPO_PUBLIC_IOS_CLIENT_ID,
  android: process.env.EXPO_PUBLIC_ANDROID_CLIENT_ID,
  web: process.env.EXPO_PUBLIC_WEB_CLIENT_ID,
});

const tokenEndpoint = 'https://oauth2.googleapis.com/token';

export default function TabOneScreen() {
  const { user } = useUser();
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
    const fetchAccessToken = async () => {
      if (response?.type === 'success') {
        const code: string = response.params.code;
        console.log(code);
        const googleResponse = await fetch(tokenEndpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: `code=${code}&client_id=${googleClientId}&redirect_uri=${redirectUri}&grant_type=authorization_code`,
        });
        console.log(googleResponse);
        const data = await googleResponse.json();
        console.log(data);
        const accessToken = data.access_token;
        console.log(accessToken);
      }
    };
    fetchAccessToken();
  }, [response]);
  return (
    <View style={styles.container}>
      <Pressable onPress={async () => request && promptAsync()}>
        <Text>sign out</Text>
      </Pressable>

      <Text style={styles.title}>Tab One</Text>
      <Text>
        Welcome, {user?.firstName} {user?.lastName}
      </Text>
      <Text>{user?.email}</Text>
      <View
        style={styles.separator}
        lightColor="#eee"
        darkColor="rgba(255,255,255,0.1)"
      />
      <EditScreenInfo path="app/(tabs)/index.tsx" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  separator: {
    marginVertical: 30,
    height: 1,
    width: '80%',
  },
});
