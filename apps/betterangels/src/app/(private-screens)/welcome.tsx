import { ScrollView, StyleSheet, View } from 'react-native';

import { handleEmailPress } from '@monorepo/expo/betterangels';
import { Colors, Spacings } from '@monorepo/expo/shared/static';
import {
  Button,
  TextBold,
  TextMedium,
  TextRegular,
} from '@monorepo/expo/shared/ui-components';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

export default function Welcome() {
  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      <ScrollView
        contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }}
      >
        <TextBold size="xl" mb="sm" textTransform="uppercase">
          Thank you,
        </TextBold>
        <TextMedium size="lg" mb="xl">
          for signing up and creating your Better Angels Account!
        </TextMedium>
        <TextRegular mb="md">Welcome!</TextRegular>
        <TextRegular mb="md">
          In the future, you'll be able to request resources for yourself that
          you might qualify for or contribute to reporting immediate needs here.
        </TextRegular>
        <TextRegular mb="md">
          For now, please wait for an email sent to your work email address from
          newaccounts@betterangels.la that will give you the link to your work
          area.
        </TextRegular>
        <TextRegular>
          Please contact{' '}
          <TextRegular
            textDecorationLine="underline"
            onPress={() => handleEmailPress('support@betterangels.la')}
          >
            support@betterangels.la
          </TextRegular>{' '}
          with any concerns.
        </TextRegular>
      </ScrollView>
      <Button
        // Temporarily reroute to the screen page with username and logout so that current user can be verified
        // and the logout functionality can be tested.
        accessibilityLabel="Close welcome screen"
        accessibilityHint="goes to auth screen"
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
