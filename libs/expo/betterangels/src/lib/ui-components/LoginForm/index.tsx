import { useApiConfig } from '@monorepo/expo/shared/clients';
import { Colors, Radiuses, Spacings } from '@monorepo/expo/shared/static';
import {
  BasicInput,
  Button,
  Loading,
} from '@monorepo/expo/shared/ui-components';
import { useAllauthLogin } from '@monorepo/react/shared';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useEmailEnvironment } from '../../hooks';
import useUser from '../../hooks/user/useUser';
import { useRememberedEmail } from '../../hooks/useRememberEmail/useRememberEmail';

export default function LoginForm() {
  const {
    email,
    setEmail,
    rememberMe,
    setRememberMe,
    persistOnSuccessfulSignIn,
  } = useRememberedEmail('non-hmis.email');

  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');

  const { fetchClient } = useApiConfig();
  const { refetchUser } = useUser();

  const { isValidEmail, isPasswordLogin } = useEmailEnvironment(email);

  const {
    step,
    errorMsg,
    sendingCode,
    confirmingCode,
    loggingIn,
    handleSendCode,
    handleConfirmCode,
    handlePasswordLogin,
    resetStep,
  } = useAllauthLogin({
    fetchClient,
    onLoginSuccess: async () => {
      await persistOnSuccessfulSignIn(email);
      await refetchUser();
    },
  });

  return (
    <View style={styles.container}>
      <BasicInput
        label="Email"
        value={email}
        onChangeText={(text) => {
          setEmail(text);
          setOtp('');
          resetStep();
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
            icon={
              loggingIn || sendingCode ? (
                <Loading size="small" color="white" />
              ) : undefined
            }
            onPress={() =>
              isPasswordLogin
                ? handlePasswordLogin(email, password)
                : handleSendCode(email)
            }
            disabled={
              (isPasswordLogin ? loggingIn : sendingCode) ||
              !isValidEmail ||
              (isPasswordLogin && !password)
            }
          />

          <Pressable
            style={({ pressed }) => [
              styles.rememberRow,
              pressed && { opacity: 0.7 },
            ]}
            onPress={() => setRememberMe((prev) => !prev)}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: rememberMe }}
            hitSlop={8}
          >
            <View
              style={[
                styles.checkboxBox,
                rememberMe && styles.checkboxBoxChecked,
              ]}
            >
              {rememberMe && <Text style={styles.checkboxTick}>✓</Text>}
            </View>

            <Text style={styles.rememberLabel}>Remember me</Text>
          </Pressable>
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
            height="lg"
            mb="md"
            borderRadius={50}
            size="full"
            variant="primary"
            accessibilityHint="Confirm OTP and sign in"
            title="Confirm OTP"
            icon={
              confirmingCode ? (
                <Loading size="small" color="white" />
              ) : undefined
            }
            onPress={() => handleConfirmCode(otp)}
            disabled={confirmingCode || !otp.trim()}
          />

          <Button
            mt="xl"
            height="lg"
            borderRadius={50}
            size="full"
            variant="secondary"
            accessibilityHint="Request Another Code"
            title="Request Another Code"
            icon={
              sendingCode ? <Loading size="small" color="white" /> : undefined
            }
            onPress={() => handleSendCode(email)}
            disabled={sendingCode}
          />
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { width: '100%' },

  error: {
    color: Colors.ERROR,
    marginTop: 10,
  },

  info: {
    color: '#555',
    marginTop: 4,
    marginBottom: 10,
    textAlign: 'center',
  },

  rememberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 45,
    marginBottom: 8,
    alignSelf: 'flex-start',
  },

  checkboxBox: {
    width: Spacings.sm,
    height: Spacings.sm,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: Radiuses.xxxs,
    borderColor: Colors.NEUTRAL_LIGHT,
  },

  checkboxBoxChecked: {
    borderColor: Colors.PRIMARY_EXTRA_DARK,
    backgroundColor: Colors.PRIMARY_EXTRA_DARK,
  },

  checkboxTick: {
    color: Colors.WHITE,
    position: 'absolute',
  },

  rememberLabel: {
    marginLeft: 12,
    fontSize: 14.5,
    color: Colors.PRIMARY_EXTRA_DARK,
    fontFamily: 'Poppins',
    fontWeight: 400,
  },
});
