import {
  RegionDeltaSize,
  coordsToRegion,
  regionDeltaMap,
} from '@monorepo/expo/shared/ui-components';
import { Region } from 'react-native-maps';
import { NotesQuery } from '../../../../apollo';

type TInteraction = NonNullable<
  NonNullable<NotesQuery['notes']>['results']
>[number];

type TProps = {
  interaction: TInteraction;
  deltaSize?: RegionDeltaSize;
};

export function getMapRegion(props: TProps): Region | null {
  const { interaction, deltaSize = 'XL' } = props;

  const point = interaction.location?.point;

  if (!point) {
    return null;
  }

  const [longitude, latitude] = point;

  return coordsToRegion({
    latitude,
    longitude,
    ...regionDeltaMap[deltaSize],
  });
}
