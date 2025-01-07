import { useMap } from '@vis.gl/react-google-maps';
import { useAtom } from 'jotai';
import { useEffect } from 'react';
import { locationAtom } from '../../atoms/locationAtom';
import { AddressAutocomplete } from '../address/AddressAutocomplete';
import { toGoogleLatLng } from '../map/utils/toGoogleLatLng';
import { SheltersDisplay } from './sheltersDisplay';

export function ShelterSearch() {
  const [location, setLocation] = useAtom(locationAtom);

  const map = useMap();

  useEffect(() => {
    if (!map) {
      return;
    }

    const center = toGoogleLatLng(location);

    center && map.setCenter(center);
  }, [map, location]);

  function onPlaceSelect(address: google.maps.places.PlaceResult | null) {
    if (!address) {
      return;
    }

    const { geometry } = address;

    const latitude = geometry?.location?.lat();
    const longitude = geometry?.location?.lng();

    if (!latitude || !longitude) {
      return;
    }

    setLocation({
      latitude,
      longitude,
      source: 'address',
    });
  }

  return (
    <>
      <AddressAutocomplete onPlaceSelect={onPlaceSelect} />

      <SheltersDisplay
        className="mt-8"
        coordinates={location}
        coordinatesSource={location?.source}
      />
    </>
  );
}
