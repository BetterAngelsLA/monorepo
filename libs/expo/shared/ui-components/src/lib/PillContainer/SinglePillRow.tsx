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
  pills: string[];
  pillVariant: IPillProps['variant'];
}) {
  const containerWidth = useRef(0);
  const [visibleCount, setVisibleCount] = useState(pills.length);
  const pillWidthCache = useRef<Record<string, number>>({});
  const [measured, setMeasured] = useState(false);

  const measurePills = useCallback(() => {
    if (
      containerWidth.current === 0 ||
      Object.keys(pillWidthCache.current).length < pills.length
    ) {
      return;
    }

    let sum = 0;
    const gap = Spacings.md;
    let count = 0;

    for (let i = 0; i < pills.length; i++) {
      const width = pillWidthCache.current[pills[i]] + (i > 0 ? gap : 0);
      if (sum + width <= containerWidth.current) {
        sum += width;
        count++;
      } else {
        break;
      }
    }

    setVisibleCount(count);
  }, [pills]);

  useEffect(() => {
    measurePills();
  }, [measurePills, measured]);

  useEffect(() => {
    setVisibleCount(pills.length);
    setMeasured(false);
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
        containerWidth.current = e.nativeEvent.layout.width;
        measurePills();
      }}
    >
      {pills.slice(0, visibleCount).map((item, idx) => (
        <View
          key={item}
          style={{ marginLeft: idx === 0 ? 0 : Spacings.xxs }}
          onLayout={(e) => {
            const width = e.nativeEvent.layout.width;
            if (pillWidthCache.current[item] !== width) {
              pillWidthCache.current[item] = width;
              setMeasured((prev) => !prev);
            }
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
