import { useCallback, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { useMutationWithErrors } from '@monorepo/apollo';
import { Colors } from '@monorepo/expo/shared/static';
import {
  BasicInput,
  Button,
  Loading,
} from '@monorepo/expo/shared/ui-components';
import { useUser } from '../../hooks';
import { HmisLoginDocument } from './__generated__/HMISLogin.generated';

export default function HMISLoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const [hmisLogin] = useMutationWithErrors(HmisLoginDocument);
  const { refetchUser } = useUser();

  const onSubmit = useCallback(async () => {
    if (!email.trim() || !password.trim()) {
      setErrorMsg('Enter your HMIS email and password.');
      return;
    }
    setErrorMsg('');
    setSubmitting(true);
    try {
      const { data, errors } = await hmisLogin({
        variables: { email, password },
      });
      if (errors?.length)
        throw new Error(errors.map((e) => e.message).join('; '));

      const res = data?.hmisLogin;
      if (!res) {
        console.error('No response from server');
        return;
      }
      if (res.__typename === 'UserType') {
        refetchUser();
        return;
      }
    } catch (e) {
      setErrorMsg(e instanceof Error ? e.message : 'Login failed');
    } finally {
      setSubmitting(false);
    }
  }, [email, password, hmisLogin, refetchUser]);

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

      {!!errorMsg && <Text style={styles.error}>{errorMsg}</Text>}

      <Button
        mt="md"
        height="lg"
        borderRadius={50}
        size="full"
        variant="primary"
        accessibilityHint="Sign in with your HMIS email and password"
        title="Sign In"
        icon={submitting ? <Loading size="small" color="white" /> : undefined}
        onPress={onSubmit}
        disabled={submitting}
        testID="hmis-submit"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { width: '100%' },
  error: { color: Colors.ERROR, marginTop: 10 },
});
