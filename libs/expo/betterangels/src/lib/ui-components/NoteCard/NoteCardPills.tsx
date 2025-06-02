import { Spacings } from '@monorepo/expo/shared/static';
import { Pill, TextRegular } from '@monorepo/expo/shared/ui-components';
import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { ServiceEnum } from '../../apollo';
import { enumDisplayServices } from '../../static/enumDisplayMapping';

export default function NoteCardPills({
  services,
  type,
}: {
  services: {
    id: string;
    service: ServiceEnum;
    serviceOther?: string | null;
  }[];
  type: 'success' | 'primary' | 'warning';
}) {
  const [containerWidth, setContainerWidth] = useState(0);
  const [pillWidths, setPillWidths] = useState<number[]>(
    Array(services.length).fill(0)
  );
  const [visibleCount, setVisibleCount] = useState(services.length);

  useEffect(() => {
    if (containerWidth > 0 && pillWidths.every((w) => w > 0)) {
      let sum = 0;
      let count = 0;
      const gap = Spacings.md;

      for (let i = 0; i < services.length; i++) {
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
  }, [containerWidth, pillWidths, services.length]);

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
      {services.slice(0, visibleCount).map((item, idx) => (
        <View
          key={item.id}
          style={{ marginLeft: idx === 0 ? 0 : Spacings.xs }}
          onLayout={(e) => {
            const w = e.nativeEvent.layout.width;
            setPillWidths((prev) => {
              const next = [...prev];
              next[idx] = w;
              return next;
            });
          }}
        >
          <Pill
            variant={type}
            label={
              item.service === ServiceEnum.Other
                ? item.serviceOther || ''
                : enumDisplayServices[item.service]
            }
          />
        </View>
      ))}

      {visibleCount < services.length && (
        <View style={{ marginLeft: Spacings.xs }}>
          <TextRegular size="md">
            + {services.length - visibleCount}
          </TextRegular>
        </View>
      )}
    </View>
  );
}
