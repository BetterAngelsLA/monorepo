import { Stack } from 'expo-router';
import { Text, View } from 'react-native';

export default function SignIn() {
  return (
    <>
      <Stack.Screen options={{ title: 'Sign In' }} />
      <View>
        <Text>This is sign in</Text>
      </View>
    </>
  );
}
