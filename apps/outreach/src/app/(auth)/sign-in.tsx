import { HomeIcon } from '@monorepo/expo/shared/icons';
import { Button } from '@monorepo/expo/shared/ui-components';
import {
  GoogleSignin,
  statusCodes,
} from '@react-native-google-signin/google-signin';
import { Stack } from 'expo-router';
import { Text, View } from 'react-native';

export default function SignIn() {
  async function signIn() {
    try {
      await GoogleSignin.hasPlayServices();
      const userInfo = await GoogleSignin.signIn();
      console.log(userInfo);
    } catch (error) {
      console.log(error);
      console.log(statusCodes);
      // if (error.code === statusCodes.SIGN_IN_CANCELLED) {
      //   // user cancelled the login flow
      // } else if (error.code === statusCodes.IN_PROGRESS) {
      //   // operation (e.g. sign in) is in progress already
      // } else if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
      //   // play services not available or outdated
      // } else {
      //   // some other error happened
      // }
    }
  }
  return (
    <>
      <Stack.Screen options={{ title: 'Sign In' }} />
      <View>
        <Text>This is sign in</Text>
        <Button title="Sign In" onPress={signIn} />
        <HomeIcon w={40} h={40} />
      </View>
    </>
  );
}
