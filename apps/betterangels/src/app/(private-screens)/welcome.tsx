import { ScrollView, StyleSheet } from 'react-native';

import { handleEmailPress } from '@monorepo/expo/betterangels';
import { H1, H2, P } from '@monorepo/expo/shared/ui-components';

export default function Welcome() {
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <H1 mb={16} textTransform="uppercase">
        Thank you,
      </H1>
      <H2 mb={56}>for signing up and creating your Better Angels Account!</H2>
      <P mb={20}>Welcome!</P>
      <P mb={20}>
        In the future, you'll be able to request resources for yourself that you
        might qualify for or contribute to reporting immediate needs here.
      </P>
      <P mb={20}>
        In the future, you'll be able to request resources for yourself that you
        might qualify for or contribute to reporting immediate needs here.
      </P>
      <P>
        For now, please wait for an email sent to your work email address from{' '}
        <P
          textDecorationLine="underline"
          onPress={() => handleEmailPress('newaccounts@betterangels.la')}
        >
          NewAccounts@betterangels.la
        </P>{' '}
        that will give you the link to your work area.
      </P>
      <P>
        Please contact{' '}
        <P
          textDecorationLine="underline"
          onPress={() => handleEmailPress('support@betterangels.la')}
        >
          support@betterangels.la
        </P>{' '}
        with any concerns
      </P>
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
