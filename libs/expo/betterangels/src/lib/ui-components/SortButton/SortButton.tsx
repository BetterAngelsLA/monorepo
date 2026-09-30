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
        {/* Invisible sizer: keeps the control as wide as the widest label so
            the arrow never moves, and gives the label a fixed box to anchor
            its trailing edge inside. */}
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
    // Both labels end with "st first", so pinning the trailing edge keeps the
    // end of the label still and leaves only the leading word to change when
    // the direction flips.
    right: 0,
  },
});
