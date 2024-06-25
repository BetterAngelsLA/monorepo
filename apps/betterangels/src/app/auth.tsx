import { AuthContainer } from '@monorepo/expo/betterangels';
import { CarIcon } from '@monorepo/expo/shared/icons';
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
        <CarIcon color="white" size="2xl"></CarIcon>
        <View style={styles.buttonsContainer}>
          <Button
            accessibilityHint="goes to sign in screen"
            mb="xs"
            onPress={() =>
              router.navigate({
                pathname: '/sign-in',
                params: {
                  type: 'sign-in',
                },
              })
            }
            title="Get Started"
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
});
