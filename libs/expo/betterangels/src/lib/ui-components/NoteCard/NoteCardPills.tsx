import { Spacings } from '@monorepo/expo/shared/static';
import { Pill, TextRegular } from '@monorepo/expo/shared/ui-components';
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
  type: 'success' | 'primary';
}) {
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacings.xs,
        flexWrap: 'wrap',
      }}
    >
      {services.slice(0, 3).map((item, idx) => (
        <Pill
          key={idx}
          type={type}
          label={
            item.service === ServiceEnum.Other
              ? item.serviceOther || ''
              : enumDisplayServices[item.service]
          }
        />
      ))}
      {services.length > 3 && (
        <TextRegular size="sm">+{services.length - 3}</TextRegular>
      )}
    </View>
  );
}
