import {
  AppleSignIn,
  AuthContainer,
  GoogleSignIn,
  LoginForm,
} from '@monorepo/expo/betterangels';
import { Colors, Spacings } from '@monorepo/expo/shared/static';
import { TextBold, TextRegular } from '@monorepo/expo/shared/ui-components';
import { Platform } from 'react-native';

import React from 'react';
import { StyleSheet, View } from 'react-native';
// DEV-445 - Implement Import Aliases to Replace Long Relative Paths
import { googleClientId, isLoginFormEnabled, redirectUri } from '../../config';

const FLOW = {
  title: 'Log In',
  message: null,
};

export default function SignIn() {
  return (
    <AuthContainer imageSource={require('./assets/images/auth-background.png')}>
      <View style={styles.container}>
        <TextBold
          mb="xl"
          color={Colors.BRAND_ANGEL_BLUE}
          size="2xl"
          textTransform="uppercase"
        >
          {FLOW.title}
        </TextBold>
        {FLOW.message && (
          <TextRegular mb="md" color={Colors.WHITE}>
            {FLOW.message}
          </TextRegular>
        )}
        <View style={{ width: '100%', marginBottom: Spacings.md }}>
          {Platform.OS === 'ios' && <AppleSignIn />}
          <GoogleSignIn
            clientId={googleClientId}
            redirectUri={redirectUri}
          ></GoogleSignIn>
        </View>
        {isLoginFormEnabled && <LoginForm></LoginForm>}
      </View>
    </AuthContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingTop: 170,
    flex: 1,
  },
});
