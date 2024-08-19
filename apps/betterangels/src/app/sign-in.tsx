import {
  AppleSignIn,
  GoogleSignIn,
  LoginForm,
  useUser,
} from '@monorepo/expo/betterangels';
import { Colors, Spacings } from '@monorepo/expo/shared/static';
import {
  Loading,
  TextBold,
  TextRegular,
} from '@monorepo/expo/shared/ui-components';
import React, { useEffect, useState } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { googleClientId, redirectUri } from '../../config';

export default function SignIn() {
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useUser();

  useEffect(() => {
    if (user) {
      setIsLoading(false);
    }
  }, [user]);

  return (
    <KeyboardAwareScrollView
      style={{ flex: 1, backgroundColor: Colors.WHITE }}
      contentContainerStyle={{
        paddingHorizontal: Spacings.sm,
        paddingBottom: Spacings.md,
      }}
      enableOnAndroid={true}
      keyboardOpeningTime={0}
    >
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <Loading size="large" />
        </View>
      ) : (
        <>
          <TextBold mb="xs" size="xl">
            Welcome!
          </TextBold>
          <TextRegular size="sm" mb="xl">
            Log in for Better Angels and start making a difference in the LA
            community.
          </TextRegular>
          {Platform.OS === 'ios' && <AppleSignIn />}
          <GoogleSignIn
            clientId={googleClientId}
            redirectUri={redirectUri}
            setIsLoading={setIsLoading}
          />
          <View style={styles.orContainer}>
            <View
              style={{
                width: 50,
                backgroundColor: Colors.WHITE,
                position: 'relative',
                zIndex: 10,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <TextRegular size="sm" style={styles.orText}>
                OR
              </TextRegular>
            </View>
            <View
              style={{
                width: '100%',
                zIndex: 2,
                height: 1,
                backgroundColor: Colors.NEUTRAL_LIGHT,
                position: 'absolute',
              }}
            />
          </View>
          <LoginForm />
        </>
      )}
    </KeyboardAwareScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  orContainer: {
    marginVertical: Spacings.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  orText: {
    color: Colors.BLACK,
  },
});
