import { useApiConfig } from '@monorepo/expo/shared/clients';
import { Colors, Spacings } from '@monorepo/expo/shared/static';
import { TextBold, TextRegular } from '@monorepo/expo/shared/ui-components';
import { useFeatureControls } from '@monorepo/react/shared';
import { Link, router } from 'expo-router';
import { ReactNode, useEffect } from 'react';
import { StyleSheet, Text } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { useUser } from '../../hooks';

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
  const { switchEnvironment, environment } = useApiConfig();
  const { refetchFeatureFlags } = useFeatureControls();

  // On mount, optionally switch env when unauthenticated.
  useEffect(() => {
    if (!user && environment !== 'production') {
      switchEnvironment('production');
    }
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
        <Text style={styles.legalWrapper}>
          <TextRegular
            textAlign="center"
            color={Colors.PRIMARY_EXTRA_DARK}
            size="xs"
          >
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
        </Text>
      ) : null}
    </KeyboardAwareScrollView>
  );
}

const styles = StyleSheet.create({
  legalWrapper: {
    maxWidth: 310,
    alignSelf: 'center',
    marginTop: 20,
    fontWeight: 400,
  },
});
