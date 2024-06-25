import { AuthContainer } from '@monorepo/expo/betterangels';
import { Button } from '@monorepo/expo/shared/ui-components';
import { useRouter } from 'expo-router';
import React from 'react';
import { StyleSheet, View } from 'react-native';
import Logo from './assets/images/logo.svg';

export default function Auth() {
  const router = useRouter();

  return (
    <AuthContainer Logo={Logo}>
      <View style={styles.buttonsContainer}>
        <Button
          accessibilityHint="goes to sign in screen"
          mb="xs"
          onPress={() =>
            router.navigate({
              pathname: '/sign-in',
            })
          }
          title="Get Started"
          size="full"
          variant="primaryDark"
          borderRadius={50}
        />
      </View>
    </AuthContainer>
  );
}

const styles = StyleSheet.create({
  buttonsContainer: {
    width: '100%',
    flex: 1,
    paddingBottom: 60,
    justifyContent: 'flex-end',
  },
});
