import { faHouse } from '@fortawesome/pro-regular-svg-icons/faHouse';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { Button } from '@monorepo/expo/shared/ui-components';
import { Stack } from 'expo-router';
import { Pressable, Text, View } from 'react-native';

export default function SignIn() {
  return (
    <>
      <Stack.Screen options={{ title: 'Sign In' }} />
      <View>
        <Text>This is sign in</Text>
        <Button title="Sign In" onPress={() => console.log('signed in')} />
        <FontAwesomeIcon
          icon="square-check" // not working
        />
        <Pressable>
          {({ pressed }) => (
            <FontAwesomeIcon
              icon={faHouse}
              size={25}
              style={{ marginRight: 15, opacity: pressed ? 0.5 : 1 }} // not working
            />
          )}
        </Pressable>
      </View>
    </>
  );
}
