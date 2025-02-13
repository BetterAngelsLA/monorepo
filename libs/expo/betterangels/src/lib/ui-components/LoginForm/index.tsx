import { gql } from '@apollo/client';
import { useApiConfig } from '@monorepo/expo/shared/clients';
import { BasicInput, Button } from '@monorepo/expo/shared/ui-components';
import { useCallback, useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useUser } from '../../hooks';
import { useLoginFormMutation } from './__generated__/index.generated';

export const LOGIN_FORM_MUTATION = gql`
  mutation LoginForm($username: String!, $password: String!) {
    login(input: { username: $username, password: $password })
      @rest(
        type: "AuthResponse"
        path: "/rest-auth/login/"
        method: "POST"
        bodyKey: "input"
      ) {
      status_code
    }
  }
`;

export default function LoginForm({
  setIsLoading,
  errorMessage,
  setErrorMessage,
}: {
  setIsLoading: (isLoading: boolean) => void;
  errorMessage: string;
  setErrorMessage: (errorMessage: string) => void;
}) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const { refetchUser } = useUser();
  const { environment, switchEnvironment } = useApiConfig();
  const [loginForm] = useLoginFormMutation();

  // States for waiting until the environment changes
  const [pendingLogin, setPendingLogin] = useState(false);
  const [targetEnv, setTargetEnv] = useState<string | null>(null);

  const isValidEmail = (email: string) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const isButtonDisabled = !isValidEmail(username) || password.length < 8;

  // This function handles the actual login process.
  const doLogin = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data } = await loginForm({
        variables: {
          username: username.toLowerCase(),
          password,
        },
      });
      if (data?.login) {
        await refetchUser();
      } else {
        setErrorMessage('Either email or password is incorrect.');
      }
    } catch (err) {
      setErrorMessage('Something went wrong. Please try again.');
      switchEnvironment('production');
    } finally {
      setIsLoading(false);
    }
  }, [
    loginForm,
    password,
    refetchUser,
    setErrorMessage,
    setIsLoading,
    switchEnvironment,
    username,
  ]);

  useEffect(() => {
    if (pendingLogin && targetEnv && environment === targetEnv) {
      doLogin();
      setPendingLogin(false);
      setTargetEnv(null);
    }
  }, [environment, pendingLogin, targetEnv, doLogin]);

  const handleLogin = () => {
    if (isButtonDisabled) {
      setErrorMessage('Either email or password is incorrect.');
      return;
    }
    const env = username.endsWith('@example.com') ? 'demo' : 'production';
    if (environment !== env) {
      console.log(`Switching to ${env} API`);
      switchEnvironment(env);
      setPendingLogin(true);
      setTargetEnv(env);
    } else {
      doLogin();
    }
  };

  return (
    <View style={styles.container}>
      <BasicInput
        label="Email"
        borderRadius={50}
        height={44}
        value={username}
        onChangeText={setUsername}
        placeholder="Enter email address"
        placeholderTextColor="#A9A9A9"
        autoCapitalize="none"
        keyboardType="email-address"
        accessibilityLabel="Username input field"
        accessibilityHint="Enter your email address"
        mb="xs"
      />
      <BasicInput
        label="Password"
        borderRadius={50}
        height={44}
        value={password}
        onChangeText={setPassword}
        placeholder="Enter password"
        placeholderTextColor="#A9A9A9"
        secureTextEntry
        accessibilityLabel="Password input field"
        accessibilityHint="Password input field"
      />
      {errorMessage ? (
        <Text style={styles.errorText}>{errorMessage}</Text>
      ) : null}
      <Button
        mt="md"
        height="lg"
        borderRadius={50}
        accessibilityHint="Sign in with email and password"
        size="full"
        title="Sign In"
        align="center"
        variant="primary"
        onPress={handleLogin}
        disabled={isButtonDisabled}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  errorText: {
    color: 'red',
    marginTop: 10,
  },
});
