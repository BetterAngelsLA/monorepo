import { AuthContainer } from '@monorepo/expo/betterangels';
import { Colors } from '@monorepo/expo/shared/static';
import {
  Button,
  Checkbox,
  TextRegular,
} from '@monorepo/expo/shared/ui-components';
import { Link, router } from 'expo-router';
import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { privacyPolicyUrl, termsOfServiceUrl } from '../../config';
import Logo from './assets/images/logo.svg';

export default function TermsOfAgreement() {
  const [checkedItems, setCheckedItems] = useState({
    isTosChecked: false,
    isPrivacyPolicyChecked: false,
  });

  const handleCheck = (key: 'isTosChecked' | 'isPrivacyPolicyChecked') => {
    setCheckedItems((prevState) => ({
      ...prevState,
      [key]: !prevState[key],
    }));
  };

  /**
   * 1. Submitting should mutate `user.hasAcceptedTos` and `user.hasAcceptedPrivacyPolicy`
   * 2. In _layout.tsx, it would check:
   *    ```
   *      if (user && (!user.hasAcceptedTos || !user.hasAcceptedPrivacyPolicy)) {
   *          return <Redirect href="/terms-of-service" />;
   *      }
   *    ```
   */

  return (
    <AuthContainer Logo={Logo}>
      <View style={styles.container}>
        <TextRegular color={Colors.WHITE}>
          Welcome to BetterAngels Outreach app!
        </TextRegular>
        <TextRegular color={Colors.WHITE}>
          Please confirm the following:
        </TextRegular>
        <Checkbox
          isChecked={checkedItems.isTosChecked}
          hasBorder
          onCheck={() => handleCheck('isTosChecked')}
          accessibilityHint={'Accept the terms of service'}
          label={
            <View style={styles.labelContainer}>
              <TextRegular ml="xs">I accept the </TextRegular>
              <Link
                style={{ textDecorationLine: 'underline' }}
                href={termsOfServiceUrl}
              >
                Terms of Service
              </Link>
            </View>
          }
        />
        <Checkbox
          isChecked={checkedItems.isPrivacyPolicyChecked}
          hasBorder
          onCheck={() => handleCheck('isPrivacyPolicyChecked')}
          accessibilityHint={'Accept the privacy policy'}
          label={
            <View style={styles.labelContainer}>
              <TextRegular ml="xs">I accept the </TextRegular>
              <Link
                style={{ textDecorationLine: 'underline' }}
                href={privacyPolicyUrl}
              >
                Privacy Policy
              </Link>
            </View>
          }
        />
      </View>
      <Button
        accessibilityHint="Submits agreement and goes to welcome screen"
        onPress={() =>
          // Update mutation here?
          router.navigate({
            pathname: '/welcome',
          })
        }
        title="Get Started"
        size="full"
        variant="primaryDark"
        borderWidth={0}
      />
    </AuthContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'flex-end',
    width: '100%',
    paddingBottom: 60,
  },
  labelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});
