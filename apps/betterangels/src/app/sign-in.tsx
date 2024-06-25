import {
  AppleSignIn,
  AuthContainer,
  GoogleSignIn,
  LoginForm,
} from '@monorepo/expo/betterangels';
import { Platform } from 'react-native';

import React from 'react';
import { StyleSheet, View } from 'react-native';
// DEV-445 - Implement Import Aliases to Replace Long Relative Paths
import { Colors } from '@monorepo/expo/shared/static';
import { TextRegular } from '@monorepo/expo/shared/ui-components';
import { Link } from 'expo-router';
import { googleClientId, isLoginFormEnabled, redirectUri } from '../../config';
import Logo from './assets/images/logo.svg';

export default function SignIn() {
  return (
    <AuthContainer Logo={Logo}>
      <View style={styles.container}>
        {Platform.OS === 'ios' && <AppleSignIn />}
        <GoogleSignIn
          clientId={googleClientId}
          redirectUri={redirectUri}
        ></GoogleSignIn>
        <TextRegular textAlign="center" color={Colors.WHITE} mt="xl">
          By continuing, you agree our{' '}
          <Link style={{ textDecorationLine: 'underline' }} href="#">
            Terms of Service
          </Link>{' '}
          and{' '}
          <Link style={{ textDecorationLine: 'underline' }} href="#">
            Privacy Policy.
          </Link>
        </TextRegular>
      </View>
      {isLoginFormEnabled && <LoginForm />}
    </AuthContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'flex-end',
    width: '100%',
    paddingBottom: 60,
  },
});
