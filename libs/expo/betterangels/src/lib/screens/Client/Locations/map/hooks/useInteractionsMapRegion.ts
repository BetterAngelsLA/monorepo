import {
  TMapDeltaLatLng,
  coordsToRegion,
  defaultRegionDelta,
} from '@monorepo/expo/shared/ui-components';
import { useMemo } from 'react';
import { TNotesQueryInteraction } from '../../../../../apollo';
import { useInteractionsMapState } from './useInteractionsMapState';

type TProps = {
  interaction?: TNotesQueryInteraction;
  delta?: TMapDeltaLatLng;
};

export function useInteractionsMapRegion({ interaction, delta }: TProps) {
  const { mapState } = useInteractionsMapState();

  const { latitude, longitude, latitudeDelta, longitudeDelta } =
    mapState?.region || {};

  const regionKey = mapState?.region
    ? `${latitude},${longitude},${latitudeDelta},${longitudeDelta}`
    : null;

  return useMemo(() => {
    if (!interaction) {
      return null;
    }

    if (mapState?.region) {
      return mapState.region;
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
