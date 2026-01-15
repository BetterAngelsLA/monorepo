import { useMutation } from '@apollo/client/react';
import { Colors, Radiuses, Spacings } from '@monorepo/expo/shared/static';
import {
  BasicInput,
  Button,
  Loading,
} from '@monorepo/expo/shared/ui-components';
import { storeHmisAuth } from '@monorepo/expo/shared/utils';
import { useCallback, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useEmailEnvironment, useUser } from '../../hooks';
import { useRememberedEmail } from '../../hooks/useRememberEmail/useRememberEmail';
import { HmisLoginDocument } from './__generated__/HMISLogin.generated';

export default function HMISLoginForm() {
  const {
    email,
    setEmail,
    rememberMe,
    setRememberMe,
    persistOnSuccessfulSignIn,
  } = useRememberedEmail('hmis.email');

  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const [hmisLogin] = useMutation(HmisLoginDocument);
  const { refetchUser } = useUser();

  const { isValidEmail } = useEmailEnvironment(email);

  const onSubmit = useCallback(async () => {
    if (!email.trim() || !password.trim()) {
      setErrorMsg('Enter your HMIS email and password.');
      return;
    }
    setErrorMsg('');
    setSubmitting(true);
    try {
      const { data, error } = await hmisLogin({
        variables: { email, password },
      });

      const res = data?.hmisLogin;
      if (!res) {
        console.error('No response from server');
        return;
      }
      if (error) {
        console.error(error.message);
        throw new Error('Sorry, login failed.');
      }
      if (res.__typename === 'HmisLoginError') {
        console.error(res.message);
        throw new Error('Sorry, login failed.');
      }
      if (res.__typename === 'HmisLoginSuccess') {
        // Store HMIS refresh URL (cookies are set via Set-Cookie headers)
        await storeHmisAuth(res.refreshUrl);
        await refetchUser();
        await persistOnSuccessfulSignIn(email);
        return;
      }
      throw new Error();
    } catch (e) {
      setErrorMsg(e instanceof Error ? e.message : 'Login failed');
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

      {!!errorMsg && <Text style={styles.error}>{errorMsg}</Text>}

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
  container: { width: '100%' },

  error: { color: Colors.ERROR, marginTop: 10 },

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
