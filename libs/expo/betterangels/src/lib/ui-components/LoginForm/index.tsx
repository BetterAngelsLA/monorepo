import { gql } from '@apollo/client';
import { FontSizes, Radiuses, Spacings } from '@monorepo/expo/shared/static';
import { useState } from 'react';
import {
  Alert,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
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

  const isValidEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const isButtonDisabled = !isValidEmail(username) || password.length < 8;

  const handleLogin = async () => {
    if (isButtonDisabled) {
      Alert.alert(
        'Error',
        'Please enter a valid email address and a password with at least 8 characters.'
      );
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
        Alert.alert('Error', 'Something went wrong. Please try again.');
      }
      if (!loading && data && 'login' in data) {
        refetchUser();
      } else {
        Alert.alert('Error', 'Invalid credentials');
      }
    } catch (error) {
      Alert.alert('Error', 'Something went wrong. Please try again.');
    }
  };

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.input}
        value={username}
        onChangeText={setUsername}
        placeholder="Enter your email address"
        placeholderTextColor="#D3D3D3"
        autoCapitalize="none"
        keyboardType="email-address"
        accessibilityLabel="Username input field"
        accessibilityHint="Enter your email address here"
      />
      <TextInput
        style={styles.input}
        value={password}
        onChangeText={setPassword}
        placeholder="Enter your password"
        placeholderTextColor="#D3D3D3"
        secureTextEntry
        accessibilityLabel="Password input field"
        accessibilityHint="Enter your password here"
      />
      <TouchableOpacity
        onPress={handleLogin}
        style={[styles.button, isButtonDisabled && styles.buttonDisabled]}
        disabled={isButtonDisabled}
        accessibilityLabel="Sign in button"
        accessibilityHint="Press to sign in with the entered username and password"
      >
        <Text style={styles.buttonText}>Sign In</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: Spacings.sm,
  },
  input: {
    color: '#D3D3D3',
    padding: Spacings.xs,
    marginBottom: Spacings.sm,
    borderRadius: Radiuses.xxs,
    backgroundColor: '#555',
  },
  button: {
    backgroundColor: '#007BFF',
    padding: 10,
    borderRadius: Radiuses.xxs,
    alignItems: 'center',
  },
  buttonDisabled: {
    backgroundColor: '#A9A9A9',
  },
  buttonText: {
    color: '#FFF',
    fontSize: FontSizes.md.fontSize,
  },
});
