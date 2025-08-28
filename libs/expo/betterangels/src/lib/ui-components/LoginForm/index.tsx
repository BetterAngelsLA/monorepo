import { useApiConfig } from '@monorepo/expo/shared/clients';
import { Colors, Regex } from '@monorepo/expo/shared/static';
import {
  BasicInput,
  Button,
  Loading,
} from '@monorepo/expo/shared/ui-components';
import { useCallback, useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import useUser from '../../hooks/user/useUser';

export default function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<'initial' | 'otp'>('initial');
  const [errorMsg, setErrorMsg] = useState('');

  const [sendingCode, setSendingCode] = useState(false);
  const [confirming, setConfirming] = useState(false);
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
    setSendingCode(false);
    setConfirming(false);
  };

  const handleSendCode = useCallback(async () => {
    setSendingCode(true);
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
      setSendingCode(false);
    }
  }, [email, fetchClient]);

  const handleConfirmCode = useCallback(async () => {
    setConfirming(true);
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
      setConfirming(false);
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
      <BasicInput
        label="Email"
        value={email}
        onChangeText={(text) => {
          setEmail(text);
          setOtp('');
          setStep('initial');
        }}
        autoCapitalize="none"
        autoCorrect={false}
        spellCheck={false}
        keyboardType="email-address"
        placeholder="you@example.com"
        borderRadius={50}
        height={44}
        mb="sm"
      />

      {step === 'initial' && (
        <>
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
              (isPasswordLogin ? loading : sendingCode) ||
              !isValidEmail ||
              (isPasswordLogin && !password)
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

          <Text style={styles.info}>
            Please check your inbox for the access code. If it doesn’t arrive
            soon, verify you’ve typed your email address correctly and request
            another code.
          </Text>

          {!!errorMsg && <Text style={styles.error}>{errorMsg}</Text>}

          <Button
            mt="md"
            mb="xs"
            height="lg"
            borderRadius={50}
            size="full"
            variant="secondary"
            accessibilityHint="Request Another Code"
            title="Request Another Code"
            icon={
              sendingCode ? <Loading size="small" color="white" /> : undefined
            }
            onPress={handleSendCode}
            disabled={sendingCode}
          />

          <Button
            mt="md"
            height="lg"
            borderRadius={50}
            size="full"
            variant="primary"
            accessibilityHint="Confirm OTP and sign in"
            title="Confirm OTP"
            icon={
              confirming ? <Loading size="small" color="white" /> : undefined
            }
            onPress={handleConfirmCode}
            disabled={confirming || !otp.trim()}
          />
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { width: '100%' },
  error: { color: Colors.ERROR, marginTop: 10 },
  info: {
    color: '#555',
    marginTop: 4,
    marginBottom: 10,
    textAlign: 'center',
  },
});
