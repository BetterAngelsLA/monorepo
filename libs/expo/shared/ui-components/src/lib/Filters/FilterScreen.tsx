import { Spacings } from '@monorepo/expo/shared/static';
import { ReactNode } from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FilterActionButtons } from './FilterActionButtons';

type TProps = {
  style?: ViewStyle;
  onDone: () => void;
  onClear: () => void;
  children: ReactNode;
};

export function FilterScreen(props: TProps) {
  const { style, onDone, onClear, children } = props;

  const insets = useSafeAreaInsets();
  const bottomOffset = insets.bottom;

  return (
    <View
      style={[{ paddingBottom: 35 + bottomOffset }, styles.container, style]}
    >
      {children}

      <FilterActionButtons onDone={onDone} onClear={onClear} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    gap: Spacings.lg,
    paddingHorizontal: Spacings.sm,
    paddingTop: Spacings.lg,
  },
});
