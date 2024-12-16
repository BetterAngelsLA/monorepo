import { APIProvider as MapsApiProvider } from '@vis.gl/react-google-maps';
import { useState } from 'react';
import { MaxWLayout } from '../../layout/maxWLayout';
import { Map } from '../../shared/components/maps/map';
import { TLatLng } from '../../shared/components/maps/types.maps';
import { ShelterSearch } from '../../shared/components/shelters/shelterSearch';

const googleMapsApiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

export function Home() {
  const [coordinates, setCoordinates] = useState<TLatLng | null>();

  function onProviderError(error: unknown) {
    console.error(`MapsApiProvider error ${error}`);
  }

  function onLocationChange(coordinates: TLatLng | null) {
    setCoordinates(coordinates);
  }

  return (
    <MapsApiProvider apiKey={googleMapsApiKey} onError={onProviderError}>
      <MaxWLayout className="-mx-4">
        <Map className="h-[480px] md:h-80" center={coordinates} />
      </MaxWLayout>
      <ShelterSearch onLocationChange={onLocationChange} />
    </MapsApiProvider>
  );
}
