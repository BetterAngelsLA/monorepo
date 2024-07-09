import { gql } from '@apollo/client';
import { Spacings } from '@monorepo/expo/shared/static';
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

  const handleLogin = async () => {
    if (username === '' || password === '') {
      Alert.alert('Error', 'Please enter both username and password');
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
      <Text style={styles.warning}>
        Warning: This should only be enabled in development!
      </Text>
      <Text style={styles.label}>Username</Text>
      <TextInput
        style={styles.input}
        value={username}
        onChangeText={setUsername}
        placeholder="Enter your username"
        placeholderTextColor="#D3D3D3"
        autoCapitalize="none"
        accessibilityLabel="Username input field"
        accessibilityHint="Enter your username here"
      />
      <Text style={styles.label}>Password</Text>
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
        style={styles.button}
        accessibilityLabel="Login button"
        accessibilityHint="Press to login with the entered username and password"
      >
        <Text style={styles.buttonText}>Login</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: Spacings.sm,
    backgroundColor: '#333',
  },
  warning: {
    color: 'red',
    fontSize: 14,
    marginBottom: Spacings.sm,
    textAlign: 'center',
  },
  label: {
    color: '#FFF',
    fontSize: Spacings.sm,
    marginBottom: Spacings.xs,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    color: '#D3D3D3',
    padding: Spacings.xs,
    marginBottom: Spacings.sm,
    borderRadius: Spacings.xxs,
    backgroundColor: '#555',
  },
  button: {
    backgroundColor: '#007BFF',
    padding: 10,
    borderRadius: Spacings.xxs,
    alignItems: 'center',
  },
  buttonText: {
    color: '#FFF',
    fontSize: Spacings.sm,
  },
});
