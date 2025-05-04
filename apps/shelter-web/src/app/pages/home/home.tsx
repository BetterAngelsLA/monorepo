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
  TMapBounds,
  TMapState,
  TMarker,
} from '../../shared/components/map/types.maps';
import { toGoogleLatLngLiteral } from '../../shared/components/map/utils/toGoogleLatLngLiteral';
import { toTMapBounds } from '../../shared/components/map/utils/toMapBounds';
import {
  ShelterCard,
  TShelter,
} from '../../shared/components/shelter/shelterCard';
import { ShelterSearch } from '../../shared/components/shelters/shelterSearch';
import { ModalAnimationEnum } from '../../shared/modal/modal';

export function Home() {
  const [_location, setLocation] = useAtom(locationAtom);
  const [_modal, setModal] = useAtom(modalAtom);
  const [shelters] = useAtom(sheltersAtom);
  const [shelterMarkers, setShelterMarkers] = useState<TMarker[]>([]);
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

  function onSearchMapArea(bounds?: google.maps.LatLngBounds) {
    if (!bounds) {
      return;
    }

    setMapBoundsFilter(toTMapBounds(bounds));
  }

  function onIdle(state: TMapState | null) {
    console.log('*****************  onIdle:', state?.center);
  }

  function onInit(state: TMapState) {
    console.log('*****************  onInit:', state.center);
  }

  function onCenterInit(state: TMapState) {
    console.log('*****************  onCenterInit:', state.center);
    setMapBoundsFilter(toTMapBounds(state.bounds));
  }

  // useEffect(() => {
  //   const savedCenter = sessionStorage.getItem('mapCenter');

  //   console.log(
  //     '################################### Home: savedCenter: ',
  //     savedCenter
  //   );

  //   if (savedCenter) {
  //     const { lat, lng } = JSON.parse(savedCenter);

  //     setDefaultCenter({
  //       latitude: lat,
  //       longitude: lng,
  //     });
  //     setLocation({
  //       latitude: lat,
  //       longitude: lng,
  //       source: 'address',
  //     });
  //   } else {
  //     setDefaultCenter(LA_COUNTY_CENTER);
  //     setLocation({
  //       ...LA_COUNTY_CENTER,
  //       source: 'address',
  //     });
  //   }
  // }, []);

  return (
    <>
      <MaxWLayout className="-mx-4">
        <Map
          mapId={SHELTERS_MAP_ID}
          className="h-[70vh] md:h-80"
          defaultCenter={toGoogleLatLngLiteral(LA_COUNTY_CENTER)}
          markers={shelterMarkers}
          onSearchMapArea={onSearchMapArea}
          onIdle={onIdle}
          onInit={onInit}
          onCenterInit={onCenterInit}
          enableUseUserLocation
        />
      </MaxWLayout>
      <ShelterSearch mapBoundsFilter={mapBoundsFilter} />
    </>
  );
}
