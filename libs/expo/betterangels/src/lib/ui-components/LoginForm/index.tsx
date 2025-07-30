import { useApiConfig } from '@monorepo/expo/shared/clients';
import { Regex } from '@monorepo/expo/shared/static';
import {
  BasicInput,
  Button,
  Loading,
} from '@monorepo/expo/shared/ui-components';
import { useAsyncStorageState } from '@monorepo/expo/shared/utils';
import { useCallback, useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import useUser from '../../hooks/user/useUser';

export default function LoginForm() {
  const [email, setEmail] = useAsyncStorageState('user_email', '');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<'initial' | 'otp'>('initial');
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const { environment, switchEnvironment, fetchClient } = useApiConfig();
  const { refetchUser } = useUser();

  const targetEnv =
    email.includes('+demo') || email.endsWith('@example.com')
      ? 'demo'
      : 'production';
  const isPasswordLogin = email.endsWith('@example.com');
  const isValidEmail = Regex.email.test(email);

  useEffect(() => {
    if (!isValidEmail) return;
    switchEnvironment(targetEnv);
  }, [email, environment, targetEnv, switchEnvironment, isValidEmail]);

  const handleError = (message: string) => {
    setErrorMsg(message);
    setLoading(false);
  };

  const handleSendCode = useCallback(async () => {
    setLoading(true);
    setErrorMsg('');

    try {
      const res = await fetchClient('/_allauth/browser/v1/auth/code/request', {
        method: 'POST',
        body: JSON.stringify({ email: email.toLowerCase() }),
      });
      if (res.ok || res.status === 401) {
        setStep('otp');
      } else {
        handleError('Unable to send code. Please try again.');
      }
    } catch (error) {
      console.error('Send code error:', error);
      handleError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [email, fetchClient]);

  const handleConfirmCode = useCallback(async () => {
    setLoading(true);
    setErrorMsg('');

    try {
      const res = await fetchClient('/_allauth/browser/v1/auth/code/confirm', {
        method: 'POST',
        body: JSON.stringify({ code: otp.trim() }),
      });
      const data = await res.json();

      if (res.ok && data?.meta?.is_authenticated) {
        await refetchUser();
      } else {
        handleError('Invalid code. Please try again.');
      }
    } catch (error) {
      console.error('Confirm code error:', error);
      handleError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [otp, fetchClient, refetchUser]);

  const handlePasswordLogin = useCallback(async () => {
    setLoading(true);
    setErrorMsg('');

    try {
      const res = await fetchClient('/_allauth/browser/v1/auth/login', {
        method: 'POST',
        body: JSON.stringify({ username: email.toLowerCase(), password }),
      });
      const data = await res.json();

      if (res.ok && data?.meta?.is_authenticated) {
        await refetchUser();
      } else {
        handleError('Invalid email or password.');
      }
    } catch (error) {
      console.error('Login error:', error);
      handleError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [email, password, fetchClient, refetchUser]);

  return (
    <View style={styles.container}>
      {step === 'initial' && (
        <>
          <BasicInput
            label="Email"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            autoCorrect={false}
            spellCheck={false}
            keyboardType="email-address"
            placeholder="you@example.com"
            borderRadius={50}
            height={44}
            mb="xs"
          />

          {isPasswordLogin && (
            <BasicInput
              label="Password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              borderRadius={50}
              height={44}
              mb="xs"
              placeholder="Password"
            />
          )}

          {!!errorMsg && <Text style={styles.error}>{errorMsg}</Text>}

          <Button
            mt="md"
            height="lg"
            borderRadius={50}
            size="full"
            variant="primary"
            accessibilityHint="Sign in to your account"
            title="Sign In"
            icon={loading ? <Loading size="small" color="white" /> : undefined}
            onPress={isPasswordLogin ? handlePasswordLogin : handleSendCode}
            disabled={
              loading || !isValidEmail || (isPasswordLogin && !password)
            }
          />
        </>
      )}

      {step === 'otp' && (
        <>
          <BasicInput
            label="OTP Code"
            value={otp}
            onChangeText={setOtp}
            autoCapitalize="characters"
            autoCorrect={false}
            spellCheck={false}
            placeholder="Enter OTP"
            borderRadius={50}
            height={44}
            mb="xs"
          />

          <Text style={styles.info}>Check your email for the access code.</Text>

          {!!errorMsg && <Text style={styles.error}>{errorMsg}</Text>}

          <Button
            mt="md"
            height="lg"
            borderRadius={50}
            size="full"
            variant="primary"
            accessibilityHint="Confirm OTP and sign in"
            title="Confirm OTP"
            icon={loading ? <Loading size="small" color="white" /> : undefined}
            onPress={handleConfirmCode}
            disabled={loading || !otp.trim()}
          />
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { width: '100%' },
  error: { color: 'red', marginTop: 10 },
  info: { color: '#555', marginTop: 4, marginBottom: 10, textAlign: 'center' },
});
