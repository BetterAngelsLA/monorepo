import {
  AuthContainer,
  useGenerateMagicLinkMutation,
} from '@monorepo/expo/betterangels';
import { Colors, Spacings } from '@monorepo/expo/shared/static';
import {
  Button,
  GoogleLoginButton,
  TextBold,
  TextRegular,
} from '@monorepo/expo/shared/ui-components';
import { useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { clientId, redirectUri } from '../../config';

type TAuthFLow = {
  [key in 'sign-in' | 'sign-up']: {
    welcome: string;
    title: string;
    message: string | null;
    question: string;
    link: string;
  };
};

const FLOW: TAuthFLow = {
  'sign-in': {
    welcome: 'WELCOME BACK!',
    title: 'SIGN IN',
    message: null,
    question: "Don't have an account?",
    link: 'Sign up',
  },
  'sign-up': {
    welcome: 'WELCOME!',
    title: 'SIGN UP',
    message:
      'If you work as a case manager or health professional, please use your work email to sign up the first time.',
    question: 'Already have an account?',
    link: 'Sign in',
  },
};

export default function SignIn() {
  const [flow, setFlow] = useState<'sign-in' | 'sign-up'>('sign-in');
  const [
    generateMagicLink,
    { data: magicLinkData, loading: magicLinkLoading, error: magicLinkError },
  ] = useGenerateMagicLinkMutation();
  const { type } = useLocalSearchParams();

  if (type !== 'sign-up' && type !== 'sign-in') {
    throw new Error('auth param is incorrect');
  }

  useEffect(() => {
    setFlow(type);
  }, [type]);

  const handleGenerateMagicLink = async () => {
    try {
      await generateMagicLink();
    } catch (err) {
      console.error('Error generating magic link:', err);
    }
  };

  return (
    <AuthContainer imageSource={require('./assets/images/auth-background.png')}>
      <View style={styles.container}>
        <TextBold textTransform="uppercase" mb="xs" color={Colors.BRAND_YELLOW}>
          {FLOW[flow].welcome}
        </TextBold>
        <TextBold
          mb="xl"
          color={Colors.BRAND_ANGEL_BLUE}
          size="2xl"
          textTransform="uppercase"
        >
          {FLOW[flow].title}
        </TextBold>
        {FLOW[flow].message && (
          <TextRegular mb="md" color={Colors.WHITE}>
            {FLOW[flow].message}
          </TextRegular>
        )}
        <View style={{ width: '100%', marginBottom: Spacings.md }}>
          <GoogleLoginButton
            flow={FLOW[flow].link}
            googleClientId={clientId}
            redirectUri={redirectUri}
          ></GoogleLoginButton>
          <Button
            accessibilityHint="send magic link for forgotten password"
            mb="xs"
            title="Generate Magic Link"
            size="full"
            variant="dark"
            onPress={handleGenerateMagicLink}
            disabled={magicLinkLoading}
          />
          {magicLinkError && (
            <Text>Error occurred: {magicLinkError.message}</Text>
          )}
          {magicLinkData && <Text>Magic Link Generated Successfully</Text>}
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <TextRegular color={Colors.WHITE}>{FLOW[flow].question}</TextRegular>
          <TextBold
            textDecorationLine="underline"
            onPress={() => setFlow(flow === 'sign-in' ? 'sign-up' : 'sign-in')}
            color={Colors.BRAND_SKY_BLUE}
          >
            {' '}
            {FLOW[flow].link}
          </TextBold>
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
