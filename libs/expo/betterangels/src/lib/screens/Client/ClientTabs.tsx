import { Colors, FontSizes, Spacings } from '@monorepo/expo/shared/static';
import { TextButton } from '@monorepo/expo/shared/ui-components';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useFeatureFlagActive } from '../../hooks';
import { FeatureFlags } from '../../providers';

export enum ClientViewTabEnum {
  Profile = 'Profile',
  Docs = 'Docs',
  Interactions = 'Interactions',
  Locations = 'Locations',
}

interface IClientTabsProps {
  tabName: ClientViewTabEnum;
  setTab: (tab: ClientViewTabEnum) => void;
}

export default function ClientTabs(props: IClientTabsProps) {
  const { tabName, setTab } = props;

  const clientLocationHistoryFeatureOn = useFeatureFlagActive(
    FeatureFlags.LOCATION_HISTORY_FF
  );

  let visibleTabs = Object.values(ClientViewTabEnum);

  if (!clientLocationHistoryFeatureOn) {
    visibleTabs = visibleTabs.filter((t) => t !== ClientViewTabEnum.Locations);
  }

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={{ backgroundColor: Colors.WHITE }}
        showsHorizontalScrollIndicator={false}
        horizontal
      >
        {visibleTabs.map((t) => (
          <View
            style={[
              styles.tab,
              {
                borderBottomWidth: t === tabName ? 3 : 0,
              },
            ]}
            key={t}
          >
            <TextButton
              onPress={() => setTab(t)}
              style={styles.textBtn}
              regular={t !== tabName}
              title={t}
              accessibilityHint={`select ${t} tab`}
            />
            <Pressable style={styles.pressable} accessibilityRole="button">
              <Text
                style={styles.tabText}
                accessibilityHint={`select ${t} tab`}
              >
                {t}
              </Text>
            </Pressable>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.WHITE,
    borderTopWidth: 1,
    borderColor: Colors.NEUTRAL_LIGHT,
  },
  tab: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    borderColor: Colors.PRIMARY,
  },
  textBtn: {
    position: 'absolute',
    zIndex: 100,
    padding: Spacings.sm,
  },
  pressable: {
    padding: Spacings.sm,
    justifyContent: 'center',
    opacity: 0,
  },
  tabText: {
    letterSpacing: 0.4,
    textAlign: 'center',
    fontFamily: 'Poppins-SemiBold',
    fontSize: FontSizes.md.fontSize,
    lineHeight: FontSizes.md.lineHeight,
  },
});
