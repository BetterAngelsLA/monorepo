import {
  AuthContainer,
  FeatureFlagControlled,
  FeatureFlags,
} from '@monorepo/expo/betterangels';
import { Button } from '@monorepo/expo/shared/ui-components';
import { useRouter } from 'expo-router';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Logo from './assets/images/logo.svg';

export default function Auth() {
  const router = useRouter();

  return (
    <AuthContainer Logo={Logo}>
      <View style={styles.buttonsContainer}>
        <FeatureFlagControlled
          flag={FeatureFlags.HMIS_FF}
          fallback={
            <Button
              accessibilityHint="Goes to sign-in screen"
              onPress={() => router.navigate('/sign-in')}
              testID="get-started-button"
              title="Get Started"
              size="full"
              variant="primaryDark"
              borderRadius={50}
              borderWidth={0}
            />
          }
        >
          <Text style={styles.heading}>Log in with</Text>
          <Button
            accessibilityHint="Opens Better Angels login"
            onPress={() => router.navigate('/sign-in')}
            testID="better-angels-login"
            title="Better Angels"
            size="full"
            variant="primaryDark"
            borderRadius={50}
            borderWidth={0}
            mb="sm"
          />

          <Button
            accessibilityHint="Opens HMIS login for service providers"
            onPress={() => router.navigate('/sign-in-hmis')}
            testID="hmis-login-button"
            title="HMIS"
            size="full"
            variant="secondary"
            borderRadius={50}
            borderWidth={1}
          />
        </FeatureFlagControlled>
      </View>
    </AuthContainer>
  );
}

const styles = StyleSheet.create({
  buttonsContainer: {
    width: '100%',
    flex: 1,
    paddingBottom: 60,
    justifyContent: 'flex-end',
  },
  heading: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
    textAlign: 'center',
  },
});
