import {
  TMapDeltaLatLng,
  coordsToRegion,
  defaultRegionDelta,
} from '@monorepo/expo/shared/ui-components';
import { useMemo } from 'react';
import { HmisNoteType } from '../../../../../../apollo';
import { useHmisClientInteractionsMapState } from '../../../../../../state';

type TProps = {
  interaction?: HmisNoteType;
  delta?: TMapDeltaLatLng;
};

export function useInteractionsMapRegion({ interaction, delta }: TProps) {
  const [mapState] = useHmisClientInteractionsMapState();

  const region = mapState?.region;

  const { latitude, longitude, latitudeDelta, longitudeDelta } = region || {};

  const regionKey = region
    ? `${latitude},${longitude},${latitudeDelta},${longitudeDelta}`
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
  }, [regionKey, interaction?.id]);
}
