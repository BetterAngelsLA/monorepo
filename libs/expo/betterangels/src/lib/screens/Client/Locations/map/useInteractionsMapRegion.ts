import { RegionDeltaSize } from '@monorepo/expo/shared/ui-components';
import { useMemo } from 'react';
import { TNotesQueryInteraction } from '../../../../apollo';
import { useClientMapState } from '../../ClientTabs';
import { getInteractionsMapRegion } from './getInteractionsMapRegion';

type TProps = {
  clientProfileId: string;
  interaction?: TNotesQueryInteraction;
  deltaSize?: RegionDeltaSize;
};

export function useInteractionsMapRegion({
  clientProfileId,
  interaction,
  deltaSize,
}: TProps) {
  const { mapState } = useClientMapState(clientProfileId);

  // console.log();
  // console.log('| ----  useInteractionsMapRegion - mapState  ----- |');
  // console.log(mapState);
  // console.log();

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

    return getInteractionsMapRegion({ interaction, deltaSize });
  }, [regionKey, interaction, deltaSize]);
}
