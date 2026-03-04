import {
  GlobeIcon,
  GroupsIcon,
  InfoIcon,
  LocationDotIcon,
} from '@monorepo/expo/shared/icons';
import { Colors, Radiuses, Spacings } from '@monorepo/expo/shared/static';
import { StyleSheet, View } from 'react-native';
import { MainContainer, NavButton } from '../../ui-components';

export function AppSettings() {
  return (
    <MainContainer pb={0} bg={Colors.NEUTRAL_EXTRA_LIGHT}>
      <View style={styles.pageCard}>
        <NavButton title="About" Icon={InfoIcon} route="settings/about" />
        <NavButton title="Team" Icon={GroupsIcon} route="settings/team" />
        <NavButton
          title="Location"
          Icon={LocationDotIcon}
          route="settings/location"
        />
        {__DEV__ && (
          <NavButton
            title="HMIS REST (dev)"
            Icon={GlobeIcon}
            route="settings/hmis-rest"
          />
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
