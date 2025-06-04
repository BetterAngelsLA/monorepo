import { Spacings } from '@monorepo/expo/shared/static';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View } from 'react-native';
import Pill from '../Pill';
import { IPillProps } from '../Pill/Pill';
import TextRegular from '../TextRegular';

interface SinglePillRowProps {
  pills: string[];
  pillVariant: IPillProps['variant'];
}

export const SinglePillRow: React.FC<SinglePillRowProps> = React.memo(
  ({ pills, pillVariant }) => {
    const containerWidth = useRef(0);
    const pillWidths = useRef<Record<string, number>>({});
    const [visibleCount, setVisibleCount] = useState(pills.length);

    const joinedPills = pills.join('|');

    const recalculateVisibility = useCallback(() => {
      if (containerWidth.current === 0) return;

      const widths = pills
        .map((label) => pillWidths.current[label])
        .filter((w): w is number => w !== undefined);
      if (widths.length !== pills.length) return;

      let sum = 0;
      let count = 0;
      const gap = Spacings.md;

      for (const width of widths) {
        const additionalWidth = count > 0 ? gap : 0;
        if (sum + width + additionalWidth > containerWidth.current) break;
        sum += width + additionalWidth;
        count++;
      }

      setVisibleCount((prev) => (prev !== count ? count : prev));
    }, [pills, containerWidth]);

    useEffect(() => {
      setVisibleCount(pills.length);
      pillWidths.current = {};
    }, [joinedPills, pills.length]);

    return (
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          marginBottom: Spacings.xs,
        }}
        onLayout={(e) => {
          containerWidth.current = e.nativeEvent.layout.width;
          requestAnimationFrame(recalculateVisibility);
        }}
      >
        {pills.slice(0, visibleCount).map((label, idx) => (
          <View
            key={label}
            style={{ marginLeft: idx === 0 ? 0 : Spacings.xxs }}
            onLayout={(e) => {
              const measuredWidth = e.nativeEvent.layout.width;
              if (pillWidths.current[label] !== measuredWidth) {
                pillWidths.current[label] = measuredWidth;
                requestAnimationFrame(recalculateVisibility);
              }
            }}
          >
            <Pill variant={pillVariant} label={label} />
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
);
