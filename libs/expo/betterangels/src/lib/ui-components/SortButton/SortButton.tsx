import { ArrowDownIcon, ArrowUpIcon } from '@monorepo/expo/shared/icons';
import { TextButton } from '@monorepo/expo/shared/ui-components';
import { StyleSheet, View } from 'react-native';

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
    <View style={styles.container}>
      <TextButton
        title={LABEL}
        onPress={onPress}
        fontSize="sm"
        regular
        accessibilityLabel={`Sort by date: ${directionLabel}`}
        accessibilityHint="Switches the list between newest first and oldest first"
      />
      {direction === 'newestFirst' ? (
        <ArrowDownIcon size="sm" ml="xs" />
      ) : (
        <ArrowUpIcon size="sm" ml="xs" />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});
