import { HomeIcon } from '@monorepo/expo/shared/icons';
import { Button } from '@monorepo/expo/shared/ui-components';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Google from 'expo-auth-session/providers/google';
import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import { Text, View } from 'react-native';
import { getUserInfo } from '../libs/helper';
import useUser from '../libs/hooks/user/useUser';

export default function SignIn() {
  const { setUser } = useUser();
  const router = useRouter();

  const [, respons, promptAsync] = Google.useAuthRequest({
    androidClientId:
      '488261458560-hlgmqbr48ig4csuucsvcbqoues4f6lls.apps.googleusercontent.com',
    iosClientId:
      '488261458560-rn7oe3rklvuqps03bndepp3v5g2goegb.apps.googleusercontent.com',
    webClientId:
      '488261458560-ign54eicotm281qll13vi7gq7ps4ga3h.apps.googleusercontent.com',
    scopes: ['profile', 'email'],
  });

  useEffect(() => {
    if (respons?.type === 'success') {
      const token = respons?.authentication?.accessToken;
      if (token) {
        getUserInfo(token)
          .then(async (data) => {
            await AsyncStorage.setItem(
              '@user',
              JSON.stringify({
                id: data.id,
                email: data.email,
                firstName: data.given_name,
                lastName: data.family_name,
              })
            );
            setUser({
              id: data.id,
              email: data.email,
              firstName: data.given_name,
              lastName: data.family_name,
            });
            router.replace('/');
          })
          .catch((e) => console.log(e));
      }
    }
  }, [respons]);

  return (
    <View>
      <Text>This is sign in</Text>
      <Button title="Sign In" onPress={() => promptAsync()} />
      <HomeIcon w={40} h={40} />
    </View>
  );
}
