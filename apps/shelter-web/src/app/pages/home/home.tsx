import { APIProvider as MapsApiProvider } from '@vis.gl/react-google-maps';
import { MaxWLayout } from '../../layout/maxWLayout';
import { Map } from '../../shared/components/maps/map';
import { ShelterSearch } from '../../shared/components/shelters/shelterSearch';

const googleMapsApiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

export function Home() {
  function onProviderError(error: unknown) {
    console.error(`MapsApiProvider error ${error}`);
  }

  const mapContainerCss = [
    'border-4 border-red-500 md:border-yellow-500 lg:md:border-purple-500',
    '-mx-4',
    'md:mx-0',
  ];

  return (
    <MapsApiProvider apiKey={googleMapsApiKey} onError={onProviderError}>
      <MaxWLayout className="border-red-500 border-4xxx" negativeMx={1}>
        <Map className="h-[480px] md:h-80" />
      </MaxWLayout>
      <ShelterSearch />
    </MapsApiProvider>
  );
}
