import { Spacings } from '@monorepo/expo/shared/static';
import { useCallback, useEffect, useRef, useState } from 'react';
import { View } from 'react-native';
import Pill from '../Pill';
import { IPillProps } from '../Pill/Pill';
import TextRegular from '../TextRegular';

export function SinglePillRow({
  pills,
  pillVariant,
}: {
  maxVisible?: number;
  pills: string[];
  pillVariant: IPillProps['variant'];
}) {
  const lastVisibleCount = useRef<number | null>(null);
  const [containerWidth, setContainerWidth] = useState(0);
  const [pillWidths, setPillWidths] = useState<number[]>(
    Array(pills.length).fill(0)
  );
  const [visibleCount, setVisibleCount] = useState(pills.length);

  const recalculateVisibleCount = useCallback(() => {
    if (containerWidth === 0 || pillWidths.some((w) => w === 0)) return;

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

    if (lastVisibleCount.current !== count) {
      lastVisibleCount.current = count;
      setVisibleCount(count);
    }
  }, [containerWidth, pillWidths, pills.length]);

  useEffect(() => {
    recalculateVisibleCount();
  }, [recalculateVisibleCount]);

  useEffect(() => {
    setPillWidths(Array(pills.length).fill(0));
    setVisibleCount(pills.length);
    lastVisibleCount.current = null;
  }, [pills.join('|')]);

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
          style={{ marginLeft: idx === 0 ? 0 : Spacings.xxs }}
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
}
