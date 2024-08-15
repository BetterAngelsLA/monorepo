import {
  AppleSignIn,
  AuthContainer,
  GoogleSignIn,
  LoginForm,
} from '@monorepo/expo/betterangels';
import { Platform } from 'react-native';

import { useUser } from '@monorepo/expo/betterangels';
import { Colors } from '@monorepo/expo/shared/static';
import { Loading, TextRegular } from '@monorepo/expo/shared/ui-components';
import { Link } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import {
  googleClientId,
  privacyPolicyUrl,
  redirectUri,
  termsOfServiceUrl,
} from '../../config';
import Logo from './assets/images/logo.svg';

export default function SignIn() {
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useUser();

  useEffect(() => {
    if (user) {
      setIsLoading(false);
    }
  }, [user]);

  return (
    <AuthContainer Logo={Logo}>
      <View style={styles.container}>
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <Loading size="large" />
          </View>
        ) : (
          <>
            {Platform.OS === 'ios' && <AppleSignIn />}
            <GoogleSignIn
              clientId={googleClientId}
              redirectUri={redirectUri}
              setIsLoading={setIsLoading}
            />
          </>
        )}

        <View style={styles.orContainer}>
          <TextRegular style={styles.orText}>Or</TextRegular>
        </View>

        <LoginForm />
        <TextRegular textAlign="center" size="sm" color={Colors.WHITE} mt="xl">
          By continuing, you agree to our{' '}
          <Link
            style={{ textDecorationLine: 'underline' }}
            href={termsOfServiceUrl}
          >
            Terms of Service
          </Link>{' '}
          and{' '}
          <Link
            style={{ textDecorationLine: 'underline' }}
            href={privacyPolicyUrl}
          >
            Privacy Policy.
          </Link>
        </TextRegular>
      </View>
    </AuthContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: 'flex-end',
    width: '100%',
    paddingBottom: 60,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  orContainer: {
    marginVertical: 20,
    alignItems: 'center',
  },
  orText: {
    fontSize: 16,
    color: Colors.WHITE,
  },
});
