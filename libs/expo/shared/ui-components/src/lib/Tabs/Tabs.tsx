import { Colors } from '@monorepo/expo/shared/static';
import { ScrollView, StyleSheet, View, ViewStyle } from 'react-native';
import { Tab } from './Tab';

type TProps<T extends string | number> = {
  tabs: readonly T[];
  selectedTab: T;
  onTabPress: (tab: T) => void;
  getLabel?: (tab: T) => string;
  style?: ViewStyle;
};

export function Tabs<T extends string | number>(props: TProps<T>) {
  const {
    tabs,
    selectedTab,
    onTabPress,
    getLabel = (t) => String(t),
    style,
  } = props;

  return (
    <View style={[styles.container, style]}>
      <ScrollView
        contentContainerStyle={{ backgroundColor: Colors.WHITE }}
        showsHorizontalScrollIndicator={false}
        horizontal
      >
        {tabs.map((tab) => (
          <Tab
            key={String(tab)}
            value={tab}
            label={getLabel(tab)}
            selected={tab === selectedTab}
            onPress={onTabPress}
          />
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
});
