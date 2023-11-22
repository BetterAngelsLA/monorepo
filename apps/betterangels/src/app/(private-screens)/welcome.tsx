import { ScrollView, StyleSheet, View } from 'react-native';

import { handleEmailPress } from '@monorepo/expo/betterangels';
import { Colors, Spacings } from '@monorepo/expo/shared/static';
import { BodyText, Button, H1, H2 } from '@monorepo/expo/shared/ui-components';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

export default function Welcome() {
  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      <ScrollView
        contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }}
      >
        <H1 mb="sm" textTransform="uppercase">
          Thank you,
        </H1>
        <H2 mb="xl">for signing up and creating your Better Angels Account!</H2>
        <BodyText mb="md">Welcome!</BodyText>
        <BodyText mb="md">
          In the future, you'll be able to request resources for yourself that
          you might qualify for or contribute to reporting immediate needs here.
        </BodyText>
        <BodyText mb="md">
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
        // Temporarily reroute to the screen page with username and logout so that current user can be verified
        // and the logout functionality can be tested.
        onPress={() => router.replace('/')}
        mb="xl"
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
    paddingHorizontal: Spacings.sm,
    paddingTop: Spacings.xl,
    backgroundColor: Colors.WHITE,
  },
});
