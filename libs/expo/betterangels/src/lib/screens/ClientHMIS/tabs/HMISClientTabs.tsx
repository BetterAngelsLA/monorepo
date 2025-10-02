import { Colors, FontSizes, Spacings } from '@monorepo/expo/shared/static';
import { TextButton } from '@monorepo/expo/shared/ui-components';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { ClientViewTabEnum } from '../../Client/ClientTabs';

const hmisTabs: ClientViewTabEnum[] = [
  ClientViewTabEnum.Profile,
  ClientViewTabEnum.Docs,
  ClientViewTabEnum.Interactions,
];

interface IClientTabsProps {
  selectedTab: ClientViewTabEnum;
  setTab: (tab: ClientViewTabEnum) => void;
}

export function HMISClientTabs(props: IClientTabsProps) {
  const { selectedTab, setTab } = props;

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={{ backgroundColor: Colors.WHITE }}
        showsHorizontalScrollIndicator={false}
        horizontal
      >
        {hmisTabs.map((tab) => (
          <View
            style={[
              styles.tab,
              {
                borderBottomWidth: tab === selectedTab ? 3 : 0,
              },
            ]}
            key={tab}
          >
            <TextButton
              onPress={() => setTab(tab)}
              style={styles.textBtn}
              regular={tab !== selectedTab}
              title={tab}
              accessibilityHint={`select ${tab} tab`}
            />
            <Pressable style={styles.pressable} accessibilityRole="button">
              <Text
                style={styles.tabText}
                accessibilityHint={`select ${tab} tab`}
              >
                {tab}
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
