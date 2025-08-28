import { useCallback, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import {
  BasicInput,
  Button,
  Loading,
  TextRegular,
} from '@monorepo/expo/shared/ui-components';
import { useUser } from '../../hooks';
import { useHmisLoginMutation } from './__generated__/HMISLogin.generated';

export default function HMISLoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string>('');

  const [hmisLogin, { loading }] = useHmisLoginMutation();
  const { refetchUser } = useUser();

  const onSubmit = useCallback(async () => {
    try {
      setErrorMsg('');
      if (!email.trim() || !password.trim()) {
        setErrorMsg('Enter your HMIS email and password.');
        return;
      }

      setSubmitting(true);

      const { data, errors } = await hmisLogin({
        variables: { email, password },
      });

      if (errors && errors.length > 0) {
        throw new Error(errors.map((e) => e.message).join('; '));
      }

      const result = data?.hmisLogin;
      if (!result) throw new Error('No response from server');

      switch (result.__typename) {
        case 'HmisLoginSuccess':
          await refetchUser();
          // TODO: this needs to be stored somewhere?
          console.log(result.hmisToken);
          return;
        case 'HmisLoginError':
          throw new Error(result.message ?? 'Invalid HMIS credentials');
        default:
          throw new Error(`Unexpected response type: ${result.__typename}`);
      }
    } catch (e) {
      setErrorMsg(e instanceof Error ? e.message : 'Login failed');
    } finally {
      setSubmitting(false);
    }
  }, [email, password, hmisLogin, refetchUser]);

  const busy = submitting || loading;

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

      {!!errorMsg && (
        <TextRegular color="red" mt="xs" accessibilityRole="alert">
          {errorMsg}
        </TextRegular>
      )}

      <Button
        mt="md"
        height="lg"
        borderRadius={50}
        size="full"
        variant="primary"
        accessibilityHint="Sign in with your HMIS email and password"
        title={busy ? 'Signing in…' : 'Sign In'}
        icon={busy ? <Loading size="small" color="white" /> : undefined}
        onPress={onSubmit}
        disabled={busy}
        testID="hmis-submit"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { width: '100%' },
});
