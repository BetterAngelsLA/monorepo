import { gql } from '@apollo/client';
import { useApolloClientContext } from '@monorepo/expo/shared/apollo';
import { BasicInput, Button } from '@monorepo/expo/shared/ui-components';
import { useEffect, useState } from 'react';
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
  const { switchToProduction, switchToDemo } = useApolloClientContext();
  const [loginForm, { loading, error }] = useLoginFormMutation({
    onError: (error) => {
      console.log('test');
      console.log(error.networkError);
    },
  });

  const isValidEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const isButtonDisabled = !isValidEmail(username) || password.length < 8;

  // Determine if the user should use the demo API based on their email
  const checkIfDemoMode = (email: string): boolean => {
    const demoDomain = '@example.com'; // Use your demo domain here
    return email.endsWith(demoDomain);
  };

  // useEffect to switch between APIs when the username changes
  useEffect(() => {
    if (username) {
      if (checkIfDemoMode(username)) {
        console.log('Switching to Demo API');
        switchToDemo();
      } else {
        console.log('Switching to Production API');
        switchToProduction();
      }
    }
  }, [username, switchToDemo, switchToProduction]);

  const handleLogin = async () => {
    if (isButtonDisabled) {
      setErrorMessage('Either email or password is incorrect.');
      return;
    }

    setIsLoading(true);

    try {
      const { data, errors } = await loginForm({
        variables: {
          username,
          password,
        },
      });

      if (error) {
        console.log(error);
        setErrorMessage('1: Something went wrong. Please try again.');
      }
      console.log(JSON.stringify(data, null, 4));
      console.log(JSON.stringify(errors, null, 4));
      if (!loading && data && 'login' in data) {
        console.log('wyuhtwayntofaynuoftoynuftoyunft');
        refetchUser(); // Refetch the user after successful login
      } else {
        setErrorMessage('Either email or password is incorrect.');
      }
    } catch (error) {
      console.log(error);
      console.log(JSON.stringify(error, null, 4));
      setErrorMessage('2: Something went wrong. Please try again.');
    }
    setIsLoading(false);
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
        height={44}
        label="Password"
        borderRadius={50}
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
