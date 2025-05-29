import { useApiConfig } from '@monorepo/expo/shared/clients';
import { BasicInput, Button } from '@monorepo/expo/shared/ui-components';
import { useCallback, useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useUser } from '../../hooks';

export default function LoginForm({
  setIsLoading,
}: {
  setIsLoading?: (loading: boolean) => void;
}) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<'initial' | 'otp'>('initial');
  const [errorMessage, setErrorMessage] = useState('');

  const { environment, switchEnvironment, fetchClient } = useApiConfig();
  const { refetchUser } = useUser();

  const targetEnv =
    email.includes('+demo') || email.endsWith('@example.com')
      ? 'demo'
      : 'production';
  const isPasswordLogin = email.endsWith('@example.com');
  const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  useEffect(() => {
    if (isValidEmail && environment !== targetEnv) {
      switchEnvironment(targetEnv);
    }
  }, [email, environment, targetEnv, switchEnvironment, isValidEmail]);

  const handleSendCode = useCallback(async () => {
    setErrorMessage('');

    try {
      const res = await fetchClient('/_allauth/browser/v1/auth/code/request', {
        method: 'POST',
        body: JSON.stringify({ email: email.toLowerCase() }),
      });

      if (res.status === 401) {
        const data = await res.json();
        if (
          data?.data?.flows.some(
            (flow: { id: string; is_pending: boolean }) =>
              flow.id === 'login_by_code' && flow.is_pending
          )
        ) {
          setStep('otp');
        } else {
          setErrorMessage('Unexpected response. Unable to send OTP.');
        }
      } else {
        setErrorMessage(`Failed to send OTP (status: ${res.status}).`);
      }
    } catch {
      setErrorMessage('Network or server error occurred.');
    }
  }, [email, fetchClient]);

  const handleConfirmCode = useCallback(async () => {
    setErrorMessage('');
    setIsLoading?.(true);

    try {
      const res = await fetchClient('/_allauth/browser/v1/auth/code/confirm', {
        method: 'POST',
        body: JSON.stringify({ code: otp }),
      });

      const data = await res.json();
      if (res.status === 200 && data.meta?.is_authenticated) {
        await refetchUser();
      } else {
        setErrorMessage(data.detail || 'Invalid OTP.');
      }
    } catch {
      setErrorMessage('Network or server error occurred.');
    } finally {
      setIsLoading?.(false);
    }
  }, [otp, fetchClient, refetchUser, setIsLoading]);

  const handlePasswordLogin = useCallback(async () => {
    setErrorMessage('');
    setIsLoading?.(true);

    try {
      const res = await fetchClient('/rest-auth/login/', {
        method: 'POST',
        body: JSON.stringify({ username: email.toLowerCase(), password }),
      });

      if (res.status === 200 || res.status === 204) {
        await refetchUser();
      } else {
        const data = await res.json();
        setErrorMessage(data.detail || 'Invalid email or password.');
      }
    } catch {
      setErrorMessage('Authentication failed.');
    } finally {
      setIsLoading?.(false);
    }
  }, [email, password, fetchClient, refetchUser, setIsLoading]);

  return (
    <View style={styles.container}>
      {step === 'initial' && (
        <>
          <BasicInput
            label="Email"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
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
          {!!errorMessage && <Text style={styles.error}>{errorMessage}</Text>}
          <Button
            mt="md"
            height="lg"
            borderRadius={50}
            size="full"
            variant="primary"
            accessibilityHint="Sign in to your account"
            title="Sign In"
            onPress={isPasswordLogin ? handlePasswordLogin : handleSendCode}
            disabled={!isValidEmail || (isPasswordLogin && !password)}
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
            placeholder="Enter OTP"
            borderRadius={50}
            height={44}
            mb="xs"
          />
          {!!errorMessage && <Text style={styles.error}>{errorMessage}</Text>}
          <Button
            mt="md"
            height="lg"
            borderRadius={50}
            size="full"
            variant="primary"
            accessibilityHint="Confirm OTP and sign in"
            title="Confirm OTP"
            onPress={handleConfirmCode}
            disabled={!otp}
          />
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { width: '100%' },
  error: { color: 'red', marginTop: 10 },
});
