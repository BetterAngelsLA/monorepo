import {
  AppleSignIn,
  AuthContainer,
  GoogleSignIn,
} from '@monorepo/expo/betterangels';
import { Colors, Spacings } from '@monorepo/expo/shared/static';
import { TextBold, TextRegular } from '@monorepo/expo/shared/ui-components';
import { Platform } from 'react-native';

import React from 'react';
import { StyleSheet, View } from 'react-native';
import { googleClientId, redirectUri } from '../../config'; // TODO: We need to rename the cliendId and redirecturi

const FLOW = {
  title: 'Log In',
  message: null,
  question: "Don't have an account?",
  link: 'Sign up',
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
          <GoogleSignIn
            clientId={googleClientId}
            redirectUri={redirectUri}
          ></GoogleSignIn>
          {Platform.OS === 'ios' && <AppleSignIn />}
        </View>
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
