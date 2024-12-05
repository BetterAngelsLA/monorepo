import { useState } from 'react';
import {
  CurrentLocation,
  TCoordinates,
  TCurrentLocationResult,
} from '../../shared/components/currentLocation';
import { SheltersByLocation } from '../../shared/components/sheltersByLocation';

export function Home() {
  const [coordinates, setCoordinates] = useState<TCoordinates | null>(null);

  function onLocationChange(result: TCurrentLocationResult | null) {
    if (!result) {
      return;
    }

    if ('location' in result) {
      const { latitude, longitude } = result.location;

      console.log('******** result.location:', latitude);

      setCoordinates({
        latitude,
        longitude,
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

      <SheltersByLocation className="mt-4" coordinates={coordinates} />
    </div>
  );
}
