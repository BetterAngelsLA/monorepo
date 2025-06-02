import { ChevronLeftIcon } from '@monorepo/expo/shared/icons';
import { Spacings } from '@monorepo/expo/shared/static';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Pill from '../Pill';
import TextBold from '../TextBold';

export function PillContainer({
  data,
  variant,
  maxVisible,
}: {
  data: string[];
  variant: 'primary' | 'success' | 'warning';
  maxVisible: number;
}) {
  const [showAll, setShowAll] = useState(false);
  const servicesToDisplay = showAll ? data : data.slice(0, maxVisible);

  return (
    <View>
      <View style={styles.pillContainer}>
        {servicesToDisplay.map((item, idx) => (
          <Pill variant={variant} label={item} key={idx} />
        ))}
      </View>

      {data.length > maxVisible && (
        <Pressable
          accessibilityRole="button"
          style={styles.button}
          accessibilityHint="show, hide pills"
          onPress={() => setShowAll(!showAll)}
        >
          <TextBold mr="xs" size="xs">
            {showAll ? `Show Less` : `View All (+${data.length - maxVisible})`}
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
