import { LocationPinIcon } from '@monorepo/expo/shared/icons';
import {
  Colors,
  Radiuses,
  Shadow,
  Spacings,
} from '@monorepo/expo/shared/static';
import { View } from 'react-native';
import TextBold from '../../TextBold';

export interface ILocationMarkerProps {
  label?: string;
}

export function LocationMarker(props: ILocationMarkerProps) {
  const { label } = props;

  return (
    <View style={{ alignItems: 'center' }}>
      {label && (
        <View
          style={{
            paddingHorizontal: Spacings.sm,
            paddingTop: Spacings.xs,
            paddingBottom: Spacings.xxs,
          }}
        >
          <View
            style={{
              paddingHorizontal: Spacings.xs,
              backgroundColor: Colors.WHITE,
              borderRadius: Radiuses.xxxl,
              ...Shadow,
            }}
          >
            <TextBold size="sm">{label}</TextBold>
          </View>
        </View>
      )}
      <LocationPinIcon width={25} height={36} />
    </View>
  );
}
