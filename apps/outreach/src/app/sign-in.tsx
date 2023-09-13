import { HomeIcon } from '@monorepo/expo/shared/icons';
import { Text, View } from 'react-native';

export default function SignIn() {
  // const { setUser } = useUser();
  // const router = useRouter();
  // const discovery = AuthSession.useAutoDiscovery('https://accounts.google.com');

  // const [request, response, promptAsync] = AuthSession.useAuthRequest(
  //   {
  //     clientId: googleClientId,
  //     redirectUri,
  //     scopes: ['profile', 'email'],
  //     responseType: 'token',
  //   },
  //   discovery
  // );

  // useEffect(() => {
  //   console.log(response);
  //   if (response?.type === 'success') {
  //     console.log(response);
  //     const { access_token } = response.params;
  //     console.log(access_token);
  //   }
  // }, [response]);

  return (
    <View>
      <Text>This is sign in</Text>

      <HomeIcon w={40} h={40} />
    </View>
  );
}
