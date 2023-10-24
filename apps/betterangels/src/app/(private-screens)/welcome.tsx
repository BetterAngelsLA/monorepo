import { StyleSheet } from 'react-native';

import { handleEmailPress } from '@monorepo/expo/betterangels';
import { colors } from '@monorepo/expo/shared/static';
import { Text, View } from '../components/Themed';

export default function Welcome() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Thank you,</Text>
      <Text style={styles.subtitle}>
        for signing up and creating your Better Angels Account!
      </Text>
      <Text style={styles.text}>Welcome!</Text>
      <Text style={styles.text}>
        In the future, you'll be able to request resources for yourself that you
        might qualify for or contribute to reporting immediate needs here.
      </Text>
      <Text style={styles.text}>
        For now, please wait for an email sent to your work email address from{' '}
        <Text
          onPress={() => handleEmailPress('newaccounts@betterangels.la')}
          style={styles.email}
        >
          NewAccounts@betterangels.la
        </Text>{' '}
        that will give you the link to your work area.
      </Text>
      <Text style={styles.text}>
        Please contact{' '}
        <Text
          onPress={() => handleEmailPress('support@betterangels.la')}
          style={styles.email}
        >
          support@betterangels.la
        </Text>{' '}
        with any concerns
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  title: {
    fontSize: 32,
    fontFamily: 'IBM-bold',
    textTransform: 'uppercase',
    color: colors.darkBlue,
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 24,
    fontFamily: 'IBM-light',
    color: colors.darkBlue,
    marginBottom: 56,
  },
  text: {
    fontFamily: 'Pragmatica-book',
    fontSize: 16,
    marginBottom: 20,
    lineHeight: 24,
    color: colors.darkBlue,
  },
  email: {
    textDecorationLine: 'underline',
    fontFamily: 'Pragmatica-book',
    fontSize: 16,
    marginBottom: 20,
    lineHeight: 24,
    color: colors.darkBlue,
  },
});
