import { ScrollView, StyleSheet } from 'react-native';

import { handleEmailPress } from '@monorepo/expo/betterangels';
import { BodyText, H1, H2 } from '@monorepo/expo/shared/ui-components';

export default function Welcome() {
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <H1 mb={16} textTransform="uppercase">
        Thank you,
      </H1>
      <H2 mb={56}>for signing up and creating your Better Angels Account!</H2>
      <BodyText mb={20}>Welcome!</BodyText>
      <BodyText mb={20}>
        In the future, you'll be able to request resources for yourself that you
        might qualify for or contribute to reporting immediate needs here.
      </BodyText>
      <BodyText mb={20}>
        In the future, you'll be able to request resources for yourself that you
        might qualify for or contribute to reporting immediate needs here.
      </BodyText>
      <BodyText>
        For now, please wait for an email sent to your work email address from{' '}
        <BodyText
          textDecorationLine="underline"
          onPress={() => handleEmailPress('newaccounts@betterangels.la')}
        >
          NewAccounts@betterangels.la
        </BodyText>{' '}
        that will give you the link to your work area.
      </BodyText>
      <BodyText>
        Please contact{' '}
        <BodyText
          textDecorationLine="underline"
          onPress={() => handleEmailPress('support@betterangels.la')}
        >
          support@betterangels.la
        </BodyText>{' '}
        with any concerns
      </BodyText>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
});
