import { useAtom } from 'jotai';
import { useEffect, useState } from 'react';
import { SHELTERS_MAP_ID } from '../../constants.app';
import { MaxWLayout } from '../../layout/maxWLayout';
import { locationAtom } from '../../shared/atoms/locationAtom';
import { sheltersAtom } from '../../shared/atoms/sheltersAtom';
import { Map } from '../../shared/components/map/map';
import { TLatLng, TMarker } from '../../shared/components/map/types.maps';
import { ShelterSearch } from '../../shared/components/shelters/shelterSearch';

export function Home() {
  const [_location, setLocation] = useAtom(locationAtom);
  const [shelters] = useAtom(sheltersAtom);
  const [shelterMarkers, setShelterMarkers] = useState<TMarker[]>([]);

  useEffect(() => {
    const markers = shelters
      .filter((shelter) => !!shelter.location)
      .map((shelter) => {
        return {
          id: shelter.id,
          position: shelter.location,
          label: shelter.name,
        } as TMarker;
      });

    setShelterMarkers(markers);
  }, [shelters]);

  function onCenterSelect(center: TLatLng) {
    setLocation({
      ...center,
      source: 'currentLocation',
    });
  }

  return (
    <>
      <MaxWLayout className="-mx-4">
        <Map
          className="h-[70vh] md:h-80"
          mapId={SHELTERS_MAP_ID}
          markers={shelterMarkers}
          onCenterSelect={onCenterSelect}
        />
      </MaxWLayout>
      <ShelterSearch />
    </>
  );
}
