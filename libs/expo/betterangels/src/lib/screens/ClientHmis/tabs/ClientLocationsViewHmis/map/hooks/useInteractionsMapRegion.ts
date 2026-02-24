import {
  TMapDeltaLatLng,
  coordsToRegion,
  defaultRegionDelta,
} from '@monorepo/expo/shared/ui-components';
import { useMemo } from 'react';
import { useClientInteractionsMapStateHmis } from '../../../../../../state';
import { HmisNoteQuery } from '../../../../../NotesHmis/ProgramNoteEditHmis/__generated__/getClientNoteHmis.generated';

type TProps = {
  interaction?: HmisNoteQuery['hmisNote'];
  delta?: TMapDeltaLatLng;
};

export function useInteractionsMapRegion({ interaction, delta }: TProps) {
  const [mapState] = useClientInteractionsMapStateHmis();

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
