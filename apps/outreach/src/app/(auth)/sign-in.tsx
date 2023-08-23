import { Button } from '@ba/expo/components';
import { Stack } from 'expo-router';
import { Text, View } from 'react-native';

export default function SignIn() {
  return (
    <>
      <Stack.Screen options={{ title: 'Sign In' }} />
      <View>
        <Text>This is sign in</Text>
        <Button title="Sign In" onPress={() => console.log('signed in')} />
      </View>
    </>
  );
}
