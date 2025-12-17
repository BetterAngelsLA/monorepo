import {
  AuthContainer,
  FeatureFlagControlled,
  FeatureFlags,
  useUser,
} from '@monorepo/expo/betterangels';
import { Colors } from '@monorepo/expo/shared/static';
import { Button } from '@monorepo/expo/shared/ui-components';
import * as Application from 'expo-application';
import { useRouter } from 'expo-router';
import * as Updates from 'expo-updates';
import React, { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import NitroCookies from 'react-native-nitro-cookies';
import Logo from './assets/images/logo.svg';

const SHARED_BUTTON_PROPS = {
  size: 'full',
  borderRadius: 50,
  borderWidth: 0,
} as const;

export default function Auth() {
  const router = useRouter();
  const { setUser } = useUser();
  const nativeVersion = Application.nativeApplicationVersion;
  const otaId = Updates.updateId;
  const otaVersion = otaId ? otaId.slice(0, 7) : 'N/A';

  useEffect(() => {
    setUser(undefined);
    NitroCookies.clearAll();
  }, []);

  return (
    <AuthContainer header={<Logo width={216} height={33} />}>
      <FeatureFlagControlled
        flag={FeatureFlags.HMIS_FF}
        fallback={
          <Button
            {...SHARED_BUTTON_PROPS}
            accessibilityHint="Goes to sign-in screen"
            onPress={() => router.navigate('/sign-in')}
            testID="get-started-button"
            title="Get Started"
            variant="primaryDark"
          />
        }
      >
        <View style={styles.buttonStack}>
          <Text style={styles.heading}>Choose an account:</Text>

          <Button
            {...SHARED_BUTTON_PROPS}
            accessibilityHint="Opens Better Angels login"
            onPress={() =>
              router.navigate({
                pathname: '/sign-in',
                params: { provider: 'ba' },
              })
            }
            testID="better-angels-login"
            title="Better Angels"
            variant="primaryDark"
          />

          <Button
            {...SHARED_BUTTON_PROPS}
            accessibilityHint="Opens HMIS login for service providers"
            onPress={() =>
              router.navigate({
                pathname: '/sign-in',
                params: { provider: 'hmis' },
              })
            }
            testID="hmis-login-button"
            title="HMIS"
            variant="secondary"
          />

          <View style={styles.versionContainer}>
            <Text style={styles.appVersion}>App version: {nativeVersion}</Text>
            <Text style={styles.appVersion}>OTA version: {otaVersion}</Text>
          </View>
        </View>
      </FeatureFlagControlled>
    </AuthContainer>
  );
}

const styles = StyleSheet.create({
  buttonStack: {
    gap: 16,
    width: '100%',
  },
  heading: {
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 18,
    textAlign: 'center',
    color: Colors.WHITE,
  },
  versionContainer: {
    alignItems: 'center',
    marginTop: 8,
  },
  appVersion: {
    fontSize: 12,
    lineHeight: 20,
    color: Colors.WHITE,
    opacity: 0.8,
  },
});
