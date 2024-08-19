import {
  AppleSignIn,
  GoogleSignIn,
  LoginForm,
  useUser,
} from '@monorepo/expo/betterangels';
import { Colors, Spacings } from '@monorepo/expo/shared/static';
import {
  Loading,
  TextBold,
  TextRegular,
} from '@monorepo/expo/shared/ui-components';
import { Link } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import {
  googleClientId,
  privacyPolicyUrl,
  redirectUri,
  termsOfServiceUrl,
} from '../../config';

export default function SignIn() {
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useUser();
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (user) {
      setIsLoading(false);
    }
  }, [user]);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <Loading size="large" />
      </View>
    );
  }

  return (
    <KeyboardAwareScrollView
      style={{ flex: 1, backgroundColor: Colors.WHITE }}
      contentContainerStyle={{
        paddingHorizontal: Spacings.sm,
        paddingBottom: Spacings.md,
      }}
      enableOnAndroid={true}
      keyboardOpeningTime={0}
    >
      <ScrollView
        contentContainerStyle={{
          flexGrow: 1,
          paddingHorizontal: Spacings.sm,
          paddingBottom: Spacings.md,
        }}
      >
        <TextBold mb="xs" size="xl">
          Welcome!
        </TextBold>
        <TextRegular size="sm" mb="xl">
          Log in for Better Angels and start making a difference in the LA
          community.
        </TextRegular>
        {Platform.OS === 'ios' && <AppleSignIn />}
        <GoogleSignIn
          clientId={googleClientId}
          redirectUri={redirectUri}
          setIsLoading={setIsLoading}
        />
        <View style={styles.orContainer}>
          <View
            style={{
              width: 50,
              backgroundColor: Colors.WHITE,
              position: 'relative',
              zIndex: 10,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <TextRegular size="sm" style={styles.orText}>
              OR
            </TextRegular>
          </View>
          <View
            style={{
              width: '100%',
              zIndex: 2,
              height: 1,
              backgroundColor: Colors.NEUTRAL_LIGHT,
              position: 'absolute',
            }}
          />
        </View>
        <LoginForm
          errorMessage={errorMessage}
          setErrorMessage={setErrorMessage}
          setIsLoading={setIsLoading}
        />
        <TextRegular textAlign="center" size="sm" color={Colors.BLACK} mt="xl">
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
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  orContainer: {
    marginVertical: Spacings.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  orText: {
    color: Colors.BLACK,
  },
});
