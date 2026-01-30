import { GlobeIcon, GroupsIcon, InfoIcon } from '@monorepo/expo/shared/icons';
import { Colors, Radiuses, Spacings } from '@monorepo/expo/shared/static';
import { useFeatureFlagActive } from '@monorepo/react/shared';
import { StyleSheet, View } from 'react-native';
import { FeatureFlags } from '../../static';
import { MainContainer, NavButton } from '../../ui-components';

export function AppSettings() {
  const devToolsEnabled = useFeatureFlagActive(FeatureFlags.DEV_TOOLS);

  return (
    <MainContainer pb={0} bg={Colors.NEUTRAL_EXTRA_LIGHT}>
      <View style={styles.pageCard}>
        <NavButton title="About" Icon={InfoIcon} route="settings/about" />
        <NavButton title="Team" Icon={GroupsIcon} route="settings/team" />
        {(__DEV__ || devToolsEnabled) && (
          <NavButton title="Dev Tools" Icon={GlobeIcon} route="dev-tools" />
        )}
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
});
