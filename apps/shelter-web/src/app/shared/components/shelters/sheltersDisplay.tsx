import { useViewSheltersQuery } from '@monorepo/react/shelter';
import { useAtom } from 'jotai';
import { useEffect } from 'react';
import { TLocationSource } from '../../atoms/locationAtom';
import { sheltersAtom } from '../../atoms/sheltersAtom';
import { TLatLng } from '../map/types.maps';
import { ShelterList } from './shelterList';

type TProps = {
  className?: string;
  coordinates: TLatLng;
  coordinatesSource?: TLocationSource;
};

export function SheltersDisplay(props: TProps) {
  const { coordinates, coordinatesSource, className = '' } = props;

  const [_sheltersData, setSheltersData] = useAtom(sheltersAtom);

  const { loading, data, error } = useViewSheltersQuery({
    variables: {
      filters: {
        geolocation: {
          latitude: coordinates?.latitude,
          longitude: coordinates?.longitude,
          rangeInMiles: 20,
        },
      },
    },
  });

  const shelters = data?.shelters?.results;

  useEffect(() => {
    setSheltersData(shelters || []);
  }, [shelters]);

  if (loading) return <div className="mt-4">Loading...</div>;

  if (error) {
    console.error(`[SheltersDisplay] ${error}`);

    return (
      <div className="mt-4">
        Sorry, there was an issue fetching the data. Please try again.
      </div>
    );
  }

  if (!shelters) {
    return null;
  }

  const locationSource =
    coordinatesSource && coordinatesSource === 'address'
      ? 'provided address'
      : 'current location';

  return (
    <div className={className}>
      <div>
        <div className="font-semibold">{shelters.length} locations</div>
        {!!locationSource && <div>(based on your {locationSource})</div>}
      </div>

      <ShelterList className="mt-4" shelters={shelters} />
    </div>
  );
}
