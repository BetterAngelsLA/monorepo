import { ChevronLeftIcon } from '@monorepo/expo/shared/icons';
import { Spacings } from '@monorepo/expo/shared/static';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Pill from '../Pill';
import TextBold from '../TextBold';
import TextRegular from '../TextRegular';

export function PillContainer({
  maxVisible = 5,
  pills,
  pillVariant,
  variant,
}: {
  maxVisible?: number;
  pills: string[];
  pillVariant: 'primary' | 'success' | 'warning';
  variant: 'singleRow' | 'expandable';
}) {
  const [showAll, setShowAll] = useState(false);
  const pillsToDisplay = showAll ? pills : pills.slice(0, maxVisible);
  const [containerWidth, setContainerWidth] = useState(0);
  const [pillWidths, setPillWidths] = useState<number[]>(
    Array(pills.length).fill(0)
  );
  const [visibleCount, setVisibleCount] = useState(pills.length);

  useEffect(() => {
    setPillWidths(Array(pills.length).fill(0));
    setVisibleCount(pills.length);
  }, [pills]);

  useEffect(() => {
    if (containerWidth > 0 && pillWidths.every((w) => w > 0)) {
      let sum = 0;
      let count = 0;
      const gap = Spacings.md;

      for (let i = 0; i < pills.length; i++) {
        const w = pillWidths[i] + (i > 0 ? gap : 0);
        if (sum + w <= containerWidth) {
          sum += w;
          count++;
        } else {
          break;
        }
      }

      setVisibleCount(count);
    }
  }, [containerWidth, pillWidths, pills.length]);

  if (variant === 'singleRow') {
    return (
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          flexWrap: 'nowrap',
          marginBottom: Spacings.xs,
        }}
        onLayout={(e) => {
          setContainerWidth(e.nativeEvent.layout.width);
        }}
      >
        {pills.slice(0, visibleCount).map((item, idx) => (
          <View
            key={idx}
            style={{ marginLeft: idx === 0 ? 0 : Spacings.xs }}
            onLayout={(e) => {
              const w = e.nativeEvent.layout.width;
              setPillWidths((prev) => {
                if (prev[idx] === w) return prev;
                const next = [...prev];
                next[idx] = w;
                return next;
              });
            }}
          >
            <Pill variant={pillVariant} label={item} />
          </View>
        ))}

        {visibleCount < pills.length && (
          <View style={{ marginLeft: Spacings.xs }}>
            <TextRegular size="sm">+ {pills.length - visibleCount}</TextRegular>
          </View>
        )}
      </View>
    );
  } else {
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
              {showAll
                ? `Show Less`
                : `View All (+${pills.length - maxVisible})`}
            </TextBold>
            <ChevronLeftIcon rotate={showAll ? '90deg' : '-90deg'} />
          </Pressable>
        )}
      </View>
    );
  }
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
