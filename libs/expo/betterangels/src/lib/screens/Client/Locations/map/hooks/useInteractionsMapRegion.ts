import {
  TMapDeltaLatLng,
  coordsToRegion,
  defaultRegionDelta,
} from '@monorepo/expo/shared/ui-components';
import { useMemo } from 'react';
import { TNotesQueryInteraction } from '../../../../../apollo';
import { useClientInteractionsMapStateRegion } from '../../../../../state/clientInteractionsMapState';

type TProps = {
  interaction?: TNotesQueryInteraction;
  delta?: TMapDeltaLatLng;
};

export function useInteractionsMapRegion({ interaction, delta }: TProps) {
  const stateMapRegion = useClientInteractionsMapStateRegion();

  const { latitude, longitude, latitudeDelta, longitudeDelta } =
    stateMapRegion || {};

  const regionKey = stateMapRegion
    ? `${latitude},${longitude},${latitudeDelta},${longitudeDelta}`
    : null;

  return useMemo(() => {
    if (!interaction) {
      return null;
    }

    if (stateMapRegion) {
      return stateMapRegion;
    }

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
  }, [regionKey, interaction?.id]);
}
