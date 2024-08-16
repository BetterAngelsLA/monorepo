import { gql } from '@apollo/client';
import { BasicInput, Button } from '@monorepo/expo/shared/ui-components'; // Importing the Button component
import { useState } from 'react';
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

export default function LoginForm() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loginForm, { loading, error }] = useLoginFormMutation();
  const { refetchUser } = useUser();
  const [errorMessage, setErrorMessage] = useState('');

  const isValidEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const isButtonDisabled = !isValidEmail(username) || password.length < 8;

  const handleLogin = async () => {
    if (isButtonDisabled) {
      setErrorMessage('Either email or password is incorrect.');
      return;
    }

    try {
      const { data } = await loginForm({
        variables: {
          username: username,
          password: password,
        },
      });

      if (error) {
        setErrorMessage('Something went wrong. Please try again.');
      }
      if (!loading && data && 'login' in data) {
        refetchUser();
      } else {
        setErrorMessage('Either email or password is incorrect.');
      }
    } catch (error) {
      setErrorMessage('Something went wrong. Please try again.');
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
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 12,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  input: {
    flex: 1,
    marginLeft: 10,
    color: '#000',
  },
  errorText: {
    color: 'red',
    marginTop: 10,
  },
});
