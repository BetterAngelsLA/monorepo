import { Link, router } from 'expo-router';
import { ReactNode, useEffect } from 'react';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';

import { useApiConfig } from '@monorepo/expo/shared/clients';
import { Colors, Spacings } from '@monorepo/expo/shared/static';
import { TextBold, TextRegular } from '@monorepo/expo/shared/ui-components';
import { useUser } from '../../hooks';
import { useFeatureControls } from '../../providers';

type AuthLayoutProps = {
  children: ReactNode;
  termsOfServiceUrl: string;
  privacyPolicyUrl: string;
};

export default function SignInContainer({
  children,
  termsOfServiceUrl,
  privacyPolicyUrl,
}: AuthLayoutProps) {
  const { user } = useUser();
  const { switchEnvironment } = useApiConfig();
  const { refetchFeatureFlags } = useFeatureControls();

  // On mount, optionally switch env when unauthenticated.
  useEffect(() => {
    if (!user) switchEnvironment('production');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // On login, refetch flags and redirect.
  useEffect(() => {
    if (user) {
      refetchFeatureFlags();
      router.replace(user.isOutreachAuthorized ? '/' : '/welcome');
    }
  }, [user]);

  return (
    <KeyboardAwareScrollView
      style={{ flex: 1, backgroundColor: Colors.WHITE }}
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
      {children}
      {termsOfServiceUrl && privacyPolicyUrl ? (
        <TextRegular textAlign="center" size="sm" color={Colors.PRIMARY_EXTRA_DARK} mt="lg">
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
      ) : null}
    </KeyboardAwareScrollView>
  );
}
