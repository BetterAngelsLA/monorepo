import { Colors, Radiuses, Spacings } from '@monorepo/expo/shared/static';
import { Divider } from '@monorepo/expo/shared/ui-components';
import { StyleSheet, View } from 'react-native';
import { useAppVersion, useFeatureFlagActive } from '../../../hooks';
import { FeatureFlags } from '../../../providers/featureControls/constants';
import { MainContainer } from '../../../ui-components';
import { AppDataCard } from './AppDataCard';
import { UpdatesDebugInfo } from './UpdatesDebugInfo';

export function AboutApp() {
  const { version, runtimeVersionShort } = useAppVersion();

  const showDebugInfoOn = useFeatureFlagActive(FeatureFlags.SHOW_DEBUG_INFO_FF);

  return (
    <MainContainer pb={0} bg={Colors.NEUTRAL_EXTRA_LIGHT}>
      <View style={styles.pageCard}>
        {version && <AppDataCard label="App Version" value={version} />}

        <Divider style={{ marginVertical: Spacings.xxs }} />

        <AppDataCard label="Runtime Version" value={runtimeVersionShort} />
      </View>

      {!!showDebugInfoOn && <UpdatesDebugInfo />}
    </MainContainer>
  );
}

const styles = StyleSheet.create({
  pageCard: {
    display: 'flex',
    padding: Spacings.sm,
    borderRadius: Radiuses.xs,
    backgroundColor: Colors.WHITE,
  },
});
