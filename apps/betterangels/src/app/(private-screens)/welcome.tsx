import { StyleSheet, View } from 'react-native';

import { handleEmailPress, useSignOut } from '@monorepo/expo/betterangels';
import { WarningIcon } from '@monorepo/expo/shared/icons';
import { Colors, Spacings } from '@monorepo/expo/shared/static';
import {
  TextButton,
  TextMedium,
  TextRegular,
} from '@monorepo/expo/shared/ui-components';
import { StatusBar } from 'expo-status-bar';

export default function Welcome() {
  const { signOut } = useSignOut();
  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      <View
        style={{ flex: 1, justifyContent: 'space-between', paddingBottom: 60 }}
      >
        <View />
        <View style={{ alignItems: 'center' }}>
          <WarningIcon size={100} color={Colors.PRIMARY} />
          <TextMedium mt="lg" textAlign="center" size="lg" mb="sm">
            Your account has not been authorized.
          </TextMedium>
          <TextRegular textAlign="center" size="sm" mb="xl">
            Please contact your organization's administrator to authorize your
            account.
          </TextRegular>
        </View>

        <View>
          <TextRegular mb="md" textAlign="center">
            Contact{' '}
            <TextRegular
              textDecorationLine="underline"
              onPress={() => handleEmailPress('support@betterangels.la')}
            >
              support@betterangels.la
            </TextRegular>{' '}
            with further questions.
          </TextRegular>
          <TextButton
            onPress={signOut}
            color={Colors.PRIMARY}
            title="Go Back to Get Started page"
            accessibilityHint={'signs out and goes to get started page'}
          />
        </View>
      </View>
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
