import { AuthContainer } from '@monorepo/expo/betterangels';
import { Button } from '@monorepo/expo/shared/ui-components';
import { useRouter } from 'expo-router';
import React from 'react';
import { SafeAreaView, StyleSheet, View } from 'react-native';
import Logo from './assets/images/logo.svg';

export default function Auth() {
  const router = useRouter();
  return (
    <AuthContainer imageSource={require('./assets/images/auth-background.png')}>
      <SafeAreaView
        style={{
          flex: 1,
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <View />
        <Logo width={200} height={30} />
        <View style={styles.buttonsContainer}>
          <Button
            style={styles.button}
            onPress={() =>
              router.push({
                pathname: '/sign-in',
                params: {
                  signIn: true,
                },
              })
            }
            title="SIGN IN"
            size="full"
            variant="sky"
          />
          <Button
            onPress={() => router.push('/sign-in')}
            title="SIGN UP"
            size="full"
            variant="sky"
          />
        </View>
      </SafeAreaView>
    </AuthContainer>
  );
}

const styles = StyleSheet.create({
  buttonsContainer: {
    width: '100%',
    paddingBottom: 113,
  },
  button: {
    marginBottom: 8,
  },
});
