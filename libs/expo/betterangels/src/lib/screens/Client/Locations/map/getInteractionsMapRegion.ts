import {
  TMapDeltaLatLng,
  coordsToRegion,
  defaultRegionDelta,
} from '@monorepo/expo/shared/ui-components';
import { Region } from 'react-native-maps';
import { TNotesQueryInteraction } from '../../../../apollo';

type TProps = {
  interaction: TNotesQueryInteraction;
  delta?: TMapDeltaLatLng;
};

export function getInteractionsMapRegion(props: TProps): Region | null {
  const { interaction, delta } = props;

  const point = interaction.location?.point;

  if (!point) {
    return null;
  }

  const latLngDeltas = delta || defaultRegionDelta;

  const [longitude, latitude] = point;

  return coordsToRegion({
    latitude,
    longitude,
    ...latLngDeltas,
  });
}
