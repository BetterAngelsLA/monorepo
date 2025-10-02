import { Colors, FontSizes, Spacings } from '@monorepo/expo/shared/static';
import { TextButton } from '@monorepo/expo/shared/ui-components';
import { ReactElement, memo } from 'react';
import { Pressable, StyleSheet, Text, View, ViewStyle } from 'react-native';

type TabItemProps<T extends string | number> = {
  value: T;
  label: string;
  selected: boolean;
  onPress: (value: T) => void;
  style?: ViewStyle;
};

const TabItem = <T extends string | number>(props: TabItemProps<T>) => {
  const { value, label, selected, onPress, style } = props;
  return (
    <View style={[styles.tab, { borderBottomWidth: selected ? 3 : 0 }, style]}>
      <TextButton
        onPress={() => onPress(value)}
        style={styles.textBtn}
        regular={!selected}
        title={label}
        accessibilityHint={`select ${label} tab`}
      />
      <Pressable
        style={styles.pressable}
        accessibilityRole="button"
        accessibilityHint={`select ${label} tab`}
        onPress={() => onPress(value)}
      >
        <Text style={styles.tabText}>{label}</Text>
      </Pressable>
    </View>
  );
};

export const Tab = memo(TabItem) as <T extends string | number>(
  p: TabItemProps<T>
) => ReactElement;

const styles = StyleSheet.create({
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
