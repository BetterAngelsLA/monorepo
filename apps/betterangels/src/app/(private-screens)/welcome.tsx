import { ScrollView, StyleSheet, View } from 'react-native';

import { handleEmailPress, useSignOut } from '@monorepo/expo/betterangels';
import { colors } from '@monorepo/expo/shared/static';
import { BodyText, Button, H1, H2 } from '@monorepo/expo/shared/ui-components';
import { StatusBar } from 'expo-status-bar';
import { apiUrl } from '../../../config';

export default function Welcome() {
  const { signOut } = useSignOut();
  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      <ScrollView
        contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }}
      >
        <H1 mb={16} textTransform="uppercase">
          Thank you,
        </H1>
        <H2 mb={56}>for signing up and creating your Better Angels Account!</H2>
        <BodyText mb={20}>Welcome!</BodyText>
        <BodyText mb={20}>
          In the future, you'll be able to request resources for yourself that
          you might qualify for or contribute to reporting immediate needs here.
        </BodyText>
        <BodyText mb={20}>
          For now, please wait for an email sent to your work email address from
          newaccounts@betterangels.la that will give you the link to your work
          area.
        </BodyText>
        <BodyText>
          Please contact{' '}
          <BodyText
            textDecorationLine="underline"
            onPress={() => handleEmailPress('support@betterangels.la')}
          >
            support@betterangels.la
          </BodyText>{' '}
          with any concerns.
        </BodyText>
      </ScrollView>
      <Button
        onPress={() => signOut(apiUrl as string)}
        mb={51}
        size="full"
        title="Close"
        variant="secondary"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingTop: 40,
    backgroundColor: colors.white,
  },
});
