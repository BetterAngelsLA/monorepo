import { APIProvider as MapsApiProvider } from '@vis.gl/react-google-maps';
import { useEffect, useState } from 'react';
import {
  CurrentLocation,
  TCurrentLocationResult,
} from '../../shared/components/currentLocation';
import { AddressAutocomplete } from '../../shared/components/form/addressAutocomplete';
import { TAddress, TLatLng } from '../../shared/components/maps/types.maps';

const googleMapsApiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

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

  function onAutocomplete(address: TAddress | null) {
    if (!address) {
      return;
    }

    const { lat, lng } = address;

    setCoordinates({ lat, lng });
  }

  return (
    <MapsApiProvider apiKey={googleMapsApiKey}>
      <CurrentLocation onChange={onLocationChange} />
      <AddressAutocomplete onAddressSelect={onAutocomplete} />
    </MapsApiProvider>
  );
}
