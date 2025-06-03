import { ChevronLeftIcon } from '@monorepo/expo/shared/icons';
import { Spacings } from '@monorepo/expo/shared/static';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Pill from '../Pill';
import TextBold from '../TextBold';

export function ExpandablePillRow({
  maxVisible = 5,
  pills,
  pillVariant,
}: {
  maxVisible?: number;
  pills: string[];
  pillVariant: 'primary' | 'success' | 'warning';
}) {
  const [showAll, setShowAll] = useState(false);
  const pillsToDisplay = showAll ? pills : pills.slice(0, maxVisible);

  return (
    <View>
      <View style={styles.pillContainer}>
        {pillsToDisplay.map((item, idx) => (
          <Pill variant={pillVariant} label={item} key={idx} />
        ))}
      </View>

      {pills.length > maxVisible && (
        <Pressable
          accessibilityRole="button"
          style={styles.button}
          accessibilityHint={
            showAll ? 'Collapse list' : 'Expand list to show all pills'
          }
          onPress={() => setShowAll(!showAll)}
        >
          <TextBold mr="xs" size="xs">
            {showAll ? `Show Less` : `View All (+${pills.length - maxVisible})`}
          </TextBold>
          <ChevronLeftIcon rotate={showAll ? '90deg' : '-90deg'} />
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  pillContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacings.xs,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacings.sm,
  },
});
