import { Colors, Spacings } from '@monorepo/expo/shared/static';
import { TextRegular } from '@monorepo/expo/shared/ui-components';
import { ElementType } from 'react';
import { StyleSheet, View } from 'react-native';
import { Header } from '../ui-components';

/**
 * Entry screen for the HMIS prod feature (experimental).
 *
 * Rendered by the clients tab when `FeatureFlags.HMIS_PROD_DEMO` is active.
 * Feature-private: nothing else under `lib/hmisProd` is exported publicly.
 * Placeholder shell for now — search/edit/enroll views will live here.
 */
export function ClientScreenHmisProd({ Logo }: { Logo: ElementType }) {
  return (
    <View style={styles.container} testID="hmis-prod-demo-screen">
      <Header title="HMIS Clients" Logo={Logo} />

      <View style={styles.content}>
        <TextRegular size="sm" color={Colors.NEUTRAL_DARK}>
          Coming soon: search clients directly from production HMIS.
        </TextRegular>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.NEUTRAL_EXTRA_LIGHT,
  },
  content: {
    flex: 1,
    padding: Spacings.sm,
  },
});
