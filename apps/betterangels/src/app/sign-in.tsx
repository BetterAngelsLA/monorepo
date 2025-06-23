import {
  LoginForm,
  useFeatureControls,
  useUser,
} from '@monorepo/expo/betterangels';
import { useApiConfig } from '@monorepo/expo/shared/clients';
import { Colors, Spacings } from '@monorepo/expo/shared/static';
import { TextBold, TextRegular } from '@monorepo/expo/shared/ui-components';
import { Link, router } from 'expo-router';
import React, { useEffect } from 'react';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { privacyPolicyUrl, termsOfServiceUrl } from '../../config';

export default function SignIn() {
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
    }
  }, [user]);

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
      <LoginForm />
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
