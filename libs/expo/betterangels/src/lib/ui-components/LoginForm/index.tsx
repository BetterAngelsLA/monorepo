import { gql } from '@apollo/client';
import { Button } from '@monorepo/expo/shared/ui-components'; // Importing the Button component
import { useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
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
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          value={username}
          onChangeText={setUsername}
          placeholder="Enter email address"
          placeholderTextColor="#A9A9A9"
          autoCapitalize="none"
          keyboardType="email-address"
          accessibilityLabel="Username input field"
        />
      </View>
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          value={password}
          onChangeText={setPassword}
          placeholder="Enter password"
          placeholderTextColor="#A9A9A9"
          secureTextEntry
          accessibilityLabel="Password input field"
        />
      </View>
      {errorMessage ? (
        <Text style={styles.errorText}>{errorMessage}</Text>
      ) : null}
      <Button
        borderWidth={0}
        borderRadius={50} // Matching the rounded style of the Google button
        accessibilityHint="Sign in with email and password"
        size="full"
        title="Sign In"
        align="center"
        variant="blue" // Assuming "blue" is a variant that matches your design, adjust if needed
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
