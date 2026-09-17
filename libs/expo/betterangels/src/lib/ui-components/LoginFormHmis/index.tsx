import { useMutation } from '@apollo/client/react';
import { BaError } from '@monorepo/ba-platform';
import { Colors, Radiuses, Spacings } from '@monorepo/expo/shared/static';
import {
  BasicInput,
  Button,
  CopyButton,
  Loading,
} from '@monorepo/expo/shared/ui-components';
import { useFeatureSwitchActive } from '@monorepo/react/shared';
import { useCallback, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useEmailEnvironment, useUser } from '../../hooks';
import { useRememberedEmail } from '../../hooks/useRememberEmail/useRememberEmail';
import { FeatureSwitches } from '../../static';
import { LoginHmisDocument } from './__generated__/LoginHmis.generated';

export default function LoginFormHmis() {
  const {
    email,
    setEmail,
    rememberMe,
    setRememberMe,
    persistOnSuccessfulSignIn,
  } = useRememberedEmail('hmis.email');

  const isHmisProdDemoSwitchEnabled = useFeatureSwitchActive(
    FeatureSwitches.HMIS_PROD_DEMO_ENABLED,
  );

  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  // debug info related to feature gated by HMIS_PROD_DEMO_ENABLED switch
  const [errorResponse, setErrorResponse] = useState('');

  const [hmisLogin] = useMutation(LoginHmisDocument);
  const { refetchUser } = useUser();

  const { isValidEmail } = useEmailEnvironment(email);

  const onSubmit = useCallback(async () => {
    if (!email.trim() || !password.trim()) {
      setErrorMsg('Enter your HMIS email and password.');
      setErrorResponse('');
      return;
    }

    const cleanedEmail = email.replace('+demo@', '@').toLowerCase().trim();

    setErrorMsg('');
    setErrorResponse('');
    setSubmitting(true);

    try {
      const response = await hmisLogin({
        variables: { email: cleanedEmail, password },
        errorPolicy: 'all',
      });

      const res = response.data?.hmisLogin;

      // success
      if (res?.__typename === 'HmisLoginSuccess') {
        await refetchUser();
        await persistOnSuccessfulSignIn(email);

        return;
      }

      // Temporary debug: copy the full raw response for any failure.
      setErrorResponse(JSON.stringify(response));

      if (response.error) {
        throw response.error;
      }

      // Known server error — safe to show its message to the user.
      if (res?.__typename === 'HmisLoginError') {
        throw new BaError(res.message);
      }

      throw new Error('Unknown error.');
    } catch (err) {
      console.error('[LoginFormHmis]', err);

      let errorMessage = 'Sorry, login failed.';

      if (err instanceof BaError && err.message) {
        errorMessage = err.message;
      }

      setErrorMsg(errorMessage);
    } finally {
      setSubmitting(false);
    }
  }, [email, password, hmisLogin, refetchUser, persistOnSuccessfulSignIn]);

  return (
    <View style={styles.container}>
      <BasicInput
        label="HMIS Email"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        autoCorrect={false}
        spellCheck={false}
        placeholder="you@example.com"
        borderRadius={50}
        height={44}
        mb="sm"
        testID="hmis-email"
      />

      <BasicInput
        label="Password"
        value={password}
        onChangeText={setPassword}
        autoCapitalize="none"
        autoCorrect={false}
        secureTextEntry
        placeholder="Password"
        borderRadius={50}
        height={44}
        mb="xs"
        testID="hmis-password"
      />

      {!!errorMsg && (
        <View style={styles.errorRow}>
          <Text style={styles.error}>{errorMsg}</Text>

          {isHmisProdDemoSwitchEnabled && errorResponse && (
            <CopyButton
              containerStyle={styles.copyButton}
              textToCopy={errorResponse}
              testID="hmis-copy-error"
            />
          )}
        </View>
      )}

      <Button
        mt="md"
        height="lg"
        borderRadius={50}
        size="full"
        variant="primary"
        accessibilityHint="Sign in with your HMIS email and password"
        title="Sign In"
        icon={submitting ? <Loading size="small" color="white" /> : undefined}
        onPress={onSubmit}
        disabled={submitting || !isValidEmail || !password}
        testID="hmis-submit"
      />

      <Pressable
        style={({ pressed }) => [
          styles.rememberRow,
          pressed && { opacity: 0.7 },
        ]}
        onPress={() => setRememberMe((prev) => !prev)}
        accessibilityRole="checkbox"
        accessibilityState={{ checked: rememberMe }}
        hitSlop={8}
      >
        <View
          style={[styles.checkboxBox, rememberMe && styles.checkboxBoxChecked]}
        >
          {rememberMe && <Text style={styles.checkboxTick}>✓</Text>}
        </View>

        <Text style={styles.rememberLabel}>Remember me</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  errorRow: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    justifyContent: 'space-between',
  },
  error: {
    flexShrink: 1,
    color: Colors.ERROR,
  },
  copyButton: {
    marginLeft: Spacings.xs,
    marginRight: Spacings.sm,
  },
  rememberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 45,
    marginBottom: 8,
    alignSelf: 'flex-start',
  },
  checkboxBox: {
    width: Spacings.sm,
    height: Spacings.sm,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: Radiuses.xxxs,
    borderColor: Colors.NEUTRAL_LIGHT,
  },
  checkboxBoxChecked: {
    borderColor: Colors.PRIMARY_EXTRA_DARK,
    backgroundColor: Colors.PRIMARY_EXTRA_DARK,
  },
  checkboxTick: {
    color: Colors.WHITE,
    position: 'absolute',
  },
  rememberLabel: {
    marginLeft: 12,
    fontSize: 14.5,
    color: Colors.PRIMARY_EXTRA_DARK,
    fontFamily: 'Poppins',
    fontWeight: 400,
  },
});
