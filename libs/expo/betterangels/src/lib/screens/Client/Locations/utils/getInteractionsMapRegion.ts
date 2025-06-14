import {
  RegionDeltaSize,
  coordsToRegion,
  regionDeltaMap,
} from '@monorepo/expo/shared/ui-components';
import { Region } from 'react-native-maps';
import { TNotesQueryInteraction } from '../../../../apollo';

type TProps = {
  interaction: TNotesQueryInteraction;
  deltaSize?: RegionDeltaSize;
};

export function getInteractionsMapRegion(props: TProps): Region | null {
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
