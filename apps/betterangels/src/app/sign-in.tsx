import {
  LoginForm,
  useFeatureControls,
  useUser,
} from '@monorepo/expo/betterangels';
import { useApiConfig } from '@monorepo/expo/shared/clients';
import { Colors, Spacings } from '@monorepo/expo/shared/static';
import {
  Loading,
  TextBold,
  TextRegular,
} from '@monorepo/expo/shared/ui-components';
import { Link, router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { privacyPolicyUrl, termsOfServiceUrl } from '../../config';

export default function SignIn() {
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useUser();
  const { switchEnvironment } = useApiConfig();
  const { refetchFeatureFlags } = useFeatureControls();

  useEffect(() => {
    // Run this effect only once on mount.
    // If there's no user, switch to production.
    if (!user) {
      switchEnvironment('production');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (user) {
      refetchFeatureFlags();
      router.replace(user.isOutreachAuthorized ? '/' : '/welcome');
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
      style={{
        flex: 1,
        backgroundColor: Colors.WHITE,
      }}
      contentContainerStyle={{
        flexGrow: 1,
        paddingHorizontal: Spacings.sm,
        paddingBottom: Spacings.md,
      }}
      bottomOffset={50}
      extraKeyboardSpace={20}
      keyboardShouldPersistTaps="handled"
    >
      <TextBold mb="xs" size="xl">
        Welcome!
      </TextBold>
      <TextRegular size="sm" mb="xl">
        Log in for Better Angels and start making a difference in the LA
        community.
      </TextRegular>
      <LoginForm setIsLoading={setIsLoading} />
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
    </KeyboardAwareScrollView>
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
