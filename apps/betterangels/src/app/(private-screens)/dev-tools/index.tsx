import {
  FeatureFlags,
  MainContainer,
  NavButton,
} from '@monorepo/expo/betterangels';
import { GlobeIcon, TestTubeIcon } from '@monorepo/expo/shared/icons';
import { Colors, Radiuses, Spacings } from '@monorepo/expo/shared/static';
import { TextBold } from '@monorepo/expo/shared/ui-components';
import { useFeatureFlagActive } from '@monorepo/react/shared';
import { Redirect } from 'expo-router';
import { StyleSheet, View } from 'react-native';

export default function DevToolsScreen() {
  const devToolsEnabled = useFeatureFlagActive(FeatureFlags.DEV_TOOLS);

  // Only allow access in __DEV__ mode OR if feature flag is enabled
  if (!__DEV__ && !devToolsEnabled) {
    return <Redirect href="/" />;
  }

  return (
    <MainContainer pb={0} bg={Colors.NEUTRAL_EXTRA_LIGHT}>
      <View style={styles.pageCard}>
        <View style={styles.header}>
          <TextBold fontSize="lg">Developer Tools</TextBold>
        </View>

        <NavButton
          title="Session Monitor"
          Icon={TestTubeIcon}
          route="dev-tools/session-debug"
        />

        <NavButton
          title="HMIS REST API"
          Icon={GlobeIcon}
          route="dev-tools/hmis-rest"
        />
      </View>
    </MainContainer>
  );
}

const styles = StyleSheet.create({
  pageCard: {
    display: 'flex',
    flexDirection: 'column',
    padding: Spacings.sm,
    borderRadius: Radiuses.xs,
    gap: 10,
  },
  header: {
    paddingBottom: Spacings.sm,
  },
});
