import { ArrowDownIcon, ArrowUpIcon } from '@monorepo/expo/shared/icons';
import { TextButton } from '@monorepo/expo/shared/ui-components';
import { StyleSheet, View } from 'react-native';

export type TSortDirection = 'newestFirst' | 'oldestFirst';

type TProps = {
  direction: TSortDirection;
  onPress: () => void;
};

export function SortButton(props: TProps) {
  const { direction, onPress } = props;

  const label = direction === 'newestFirst' ? 'Newest first' : 'Oldest first';

  return (
    <View style={styles.container}>
      {direction === 'newestFirst' ? (
        <ArrowDownIcon size="sm" mr="xs" />
      ) : (
        <ArrowUpIcon size="sm" mr="xs" />
      )}
      <TextButton
        title={label}
        onPress={onPress}
        fontSize="sm"
        regular
        accessibilityLabel={`Sort order: ${label}`}
        accessibilityHint="Switches the list between newest first and oldest first"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});
