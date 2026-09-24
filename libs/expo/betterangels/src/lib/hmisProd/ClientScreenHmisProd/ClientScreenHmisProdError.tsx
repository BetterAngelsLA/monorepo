import { Button, ErrorListView } from '@monorepo/expo/shared/ui-components';
import { StyleSheet, View } from 'react-native';
import { pagePaddingHorizontal } from '../../static';

type TProps = {
  title: string;
  bodyText?: string;
  onLogInAgain: () => void;
};

/**
 * Error view for `ClientScreenHmisProd` — shown for missing/expired HMIS
 * sessions. Offers a "Log in again" action (`signOut`) so the user can
 * re-authenticate cleanly.
 */
export function ClientScreenHmisProdError({
  title,
  bodyText,
  onLogInAgain,
}: TProps) {
  return (
    <View style={styles.container}>
      <ErrorListView title={title} bodyText={bodyText} />

      <Button
        mt="md"
        height="lg"
        borderRadius={50}
        size="full"
        variant="primary"
        title="Log in again"
        accessibilityHint="Signs out so you can log in to HMIS again"
        onPress={onLogInAgain}
        testID="hmis-prod-login-again"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: pagePaddingHorizontal,
  },
});
