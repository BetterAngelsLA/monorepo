import { ArrowDownIcon, ArrowUpIcon } from '@monorepo/expo/shared/icons';
import { TextRegular } from '@monorepo/expo/shared/ui-components';
import { Pressable, StyleSheet } from 'react-native';

export type TSortDirection = 'newestFirst' | 'oldestFirst';

type TProps = {
  direction: TSortDirection;
  onPress: () => void;
};

const LABEL = 'Date';

export function SortButton(props: TProps) {
  const { direction, onPress } = props;

  const directionLabel =
    direction === 'newestFirst' ? 'newest first' : 'oldest first';

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Sort by date: ${directionLabel}`}
      accessibilityHint="Switches the list between newest first and oldest first"
      hitSlop={12}
      onPress={onPress}
      style={({ pressed }) => [styles.container, pressed && styles.pressed]}
    >
      <TextRegular size="sm">{LABEL}</TextRegular>
      {direction === 'newestFirst' ? (
        <ArrowDownIcon size="sm" ml="xs" />
      ) : (
        <ArrowUpIcon size="sm" ml="xs" />
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  pressed: {
    opacity: 0.7,
  },
});
