import { useAtom } from 'jotai';
import { useEffect, useState } from 'react';
import { SHELTERS_MAP_ID } from '../../constants.app';
import { MaxWLayout } from '../../layout/maxWLayout';
import { locationAtom } from '../../shared/atoms/locationAtom';
import { modalAtom } from '../../shared/atoms/modalAtom';
import { sheltersAtom } from '../../shared/atoms/sheltersAtom';
import { LA_COUNTY_CENTER } from '../../shared/components/map/constants.maps';
import { Map } from '../../shared/components/map/map';
import {
  TLatLng,
  TMapBounds,
  TMarker,
} from '../../shared/components/map/types.maps';
import {
  ShelterCard,
  TShelter,
} from '../../shared/components/shelter/shelterCard';
import { ShelterSearch } from '../../shared/components/shelters/shelterSearch';
import { ModalAnimationEnum } from '../../shared/modal/modal';

export function Home() {
  const [_location, setLocation] = useAtom(locationAtom);
  const [shelters] = useAtom(sheltersAtom);
  const [_modal, setModal] = useAtom(modalAtom);
  const [shelterMarkers, setShelterMarkers] = useState<TMarker[]>([]);
  const [defaultCenter, setDefaultCenter] = useState<TLatLng>();
  const [showSearchButton, setShowSearchButton] = useState(false);
  const [mapBoundsFilter, setMapBoundsFilter] = useState<TMapBounds>();

  useEffect(() => {
    const markers = shelters
      .filter((shelter) => !!shelter.location)
      .map((shelter) => {
        return {
          id: shelter.id,
          position: shelter.location,
          label: shelter.name,
          onClick: () => handleClick(shelter.id),
        } as TMarker;
      });

    setShelterMarkers(markers);
  }, [shelters]);

  const handleClick = (markerId: string | null | undefined) => {
    if (!markerId) {
      return;
    }
    setModal({
      content: (
        <ShelterCard
          className="mt-4"
          shelter={
            shelters.find((shelter) => shelter.id === markerId) as TShelter
          }
        />
      ),
      animation: ModalAnimationEnum.EXPAND,
      closeOnMaskClick: true,
    });
  };

  function onCenterSelect(center: TLatLng) {
    setLocation({
      ...center,
      source: 'currentLocation',
    });
  }

  function onSearchMapArea() {
    const mapBounds = sessionStorage.getItem('mapBounds');

    if (!mapBounds) return;

    const bounds = JSON.parse(mapBounds);
    setMapBoundsFilter({
      westLng: bounds.westLng,
      northLat: bounds.northLat,
      eastLng: bounds.eastLng,
      southLat: bounds.southLat,
    });

    setShowSearchButton(false);
  }

  useEffect(() => {
    const savedCenter = sessionStorage.getItem('mapCenter');

    if (savedCenter) {
      const { lat, lng } = JSON.parse(savedCenter);
      setDefaultCenter({
        latitude: lat,
        longitude: lng,
      });
    } else {
      setDefaultCenter(LA_COUNTY_CENTER);
    }
  }, []);

  return (
    <>
      <MaxWLayout className="-mx-4">
        <Map
          defaultCenter={defaultCenter}
          className="h-[70vh] md:h-80"
          mapId={SHELTERS_MAP_ID}
          markers={shelterMarkers}
          showSearchButton={showSearchButton}
          setShowSearchButton={setShowSearchButton}
          onCenterSelect={onCenterSelect}
          onSearchMapArea={onSearchMapArea}
        />
      </MaxWLayout>
      <ShelterSearch mapBoundsFilter={mapBoundsFilter} />
    </>
  );
}
