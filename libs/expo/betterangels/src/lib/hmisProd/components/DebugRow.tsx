import { Colors, Spacings } from '@monorepo/expo/shared/static';
import { CopyButton, TextRegular } from '@monorepo/expo/shared/ui-components';
import { useFeatureFlagActive } from '@monorepo/react/shared';
import { StyleSheet, View } from 'react-native';
import { FeatureFlags, pagePaddingHorizontal } from '../../static';
import {
  getDebugCopyTextHmisProd,
  type HmisProdRequestDebugInfo,
} from '../api';

type TProps = {
  debugInfo: HmisProdRequestDebugInfo | null;
  testID?: string;
};

/**
 * "Debug Info" row for the HMIS prod screens — request URL, status, auth
 * context and raw response body for copy/paste (the raw body is included only
 * on failures, since successful responses contain client data).
 *
 * Self-gated by `FeatureFlags.HMIS_PROD_DEMO_DEBUG_MODE` — renders nothing
 * when the flag is off.
 */
export function DebugRow(props: TProps) {
  const { debugInfo, testID = 'hmis-prod-copy-debug-info' } = props;

  const debugModeEnabled = useFeatureFlagActive(
    FeatureFlags.HMIS_PROD_DEMO_DEBUG_MODE,
  );

  if (!debugModeEnabled) {
    return null;
  }

  return (
    <View style={styles.container}>
      <TextRegular size="xs" color={Colors.NEUTRAL_DARK}>
        Debug Info
      </TextRegular>
      <CopyButton
        textToCopy={getDebugCopyTextHmisProd(debugInfo)}
        testID={testID}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacings.xs,
    paddingHorizontal: pagePaddingHorizontal,
    marginBottom: Spacings.xs,
  },
});
