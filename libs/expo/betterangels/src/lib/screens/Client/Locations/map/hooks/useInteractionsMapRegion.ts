import {
  TMapDeltaLatLng,
  coordsToRegion,
  defaultRegionDelta,
} from '@monorepo/expo/shared/ui-components';
import { useMemo } from 'react';
import { TNotesQueryInteraction } from '../../../../../apollo';
import { useClientInteractionsMapState } from '../../../../../state';

type TProps = {
  interaction?: TNotesQueryInteraction;
  delta?: TMapDeltaLatLng;
};

export function useInteractionsMapRegion({ interaction, delta }: TProps) {
  const [mapState] = useClientInteractionsMapState();

  const region = mapState?.region;

  const { latitude, longitude, latitudeDelta, longitudeDelta } = region || {};

  const regionKey = region
    ? `${latitude},${longitude},${latitudeDelta},${longitudeDelta}`
    : null;

  const deltaKey = delta
    ? `${delta.latitudeDelta},${delta.longitudeDelta}`
    : null;

  return useMemo(() => {
    if (!interaction) {
      return null;
    }

    if (region) {
      return region;
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
    // interaction?.id, regionKey, and deltaKey are stable keys that avoid
    // recomputation on reference-only changes of the raw objects.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [regionKey, deltaKey, interaction?.id]);
}
