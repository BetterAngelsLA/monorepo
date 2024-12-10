import { APIProvider as MapsApiProvider } from '@vis.gl/react-google-maps';
import { useEffect, useState } from 'react';
import { AddressAutocomplete } from '../address/AddressAutocomplete';
import { CurrentLocation, TCurrentLocationResult } from '../currentLocation';
import { TLatLng } from '../maps/types.maps';
import { SheltersByLocation } from './sheltersByLocation';

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

  function onPlaceSelect(address: google.maps.places.PlaceResult | null) {
    if (!address) {
      return;
    }

    const { geometry } = address;

    const lat = geometry?.location?.lat();
    const lng = geometry?.location?.lng();

    if (!lat || !lng) {
      return;
    }

    setCoordinates({
      lat,
      lng,
    });
  }

  return (
    <MapsApiProvider apiKey={googleMapsApiKey}>
      <CurrentLocation onChange={onLocationChange} />
      <AddressAutocomplete onPlaceSelect={onPlaceSelect} />

      <SheltersByLocation className="mt-8" coordinates={coordinates} />
    </MapsApiProvider>
  );
}
