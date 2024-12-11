import { useEffect, useState } from 'react';
import {
  CurrentLocation,
  TCurrentLocationResult,
} from '../../../shared/components/currentLocation';
import { TLatLng } from '../../../shared/components/maps/types.maps';
import { SheltersByLocation } from './sheltersByLocation';

export function ShelterSearch() {
  const [coordinates, setCoordinates] = useState<TLatLng | null>(null);

  useEffect(() => {
    console.log('*****************  coordinates:', coordinates);
  }, [coordinates]);

  function onLocationChange(result: TCurrentLocationResult | null) {
    if (!result) {
      return;
    }

    if ('location' in result) {
      const { lat, lng } = result.location;

      setCoordinates({
        lat,
        lng,
      });
    }

    if ('error' in result) {
      console.log('******** result.error:', result.error);

      setCoordinates(null);
    }
  }

  return (
    <div>
      <CurrentLocation onChange={onLocationChange} />
      <SheltersByLocation className="mt-8" coordinates={coordinates} />
    </div>
  );
}
