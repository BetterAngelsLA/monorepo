import { ArrowDownIcon, ArrowUpIcon } from '@monorepo/expo/shared/icons';
import { FontSizes } from '@monorepo/expo/shared/static';
import { TextButton } from '@monorepo/expo/shared/ui-components';
import { StyleSheet, Text, View } from 'react-native';

export type TSortDirection = 'newestFirst' | 'oldestFirst';

type TProps = {
  direction: TSortDirection;
  onPress: () => void;
};

const LABELS: Record<TSortDirection, string> = {
  newestFirst: 'Newest first',
  oldestFirst: 'Oldest first',
};

export function SortButton(props: TProps) {
  const { direction, onPress } = props;

  const label = LABELS[direction];

  return (
    <View style={styles.container}>
      {direction === 'newestFirst' ? (
        <ArrowDownIcon size="sm" mr="xs" />
      ) : (
        <ArrowUpIcon size="sm" mr="xs" />
      )}
      <View>
        {/* Invisible sizer: renders every label so the control always has the
            width of the widest one. Without it, the arrow and text shift
            sideways whenever the label swaps. */}
        <View
          style={styles.sizer}
          accessible={false}
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
        >
          {Object.values(LABELS).map((value) => (
            <Text key={value} style={styles.sizerText}>
              {value}
            </Text>
          ))}
        </View>
        <TextButton
          title={label}
          onPress={onPress}
          fontSize="sm"
          regular
          style={styles.button}
          accessibilityLabel={`Sort order: ${label}`}
          accessibilityHint="Switches the list between newest first and oldest first"
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sizer: {
    height: FontSizes.sm.lineHeight,
    overflow: 'hidden',
    opacity: 0,
  },
  sizerText: {
    fontFamily: 'Poppins-Regular',
    fontSize: FontSizes.sm.fontSize,
    lineHeight: FontSizes.sm.lineHeight,
    letterSpacing: 0.4,
  },
  button: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
  },
});
