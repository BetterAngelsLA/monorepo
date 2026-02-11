import { mergeCss } from '@monorepo/react/shared';
import { useMap } from '@vis.gl/react-google-maps';
import { useAtom } from 'jotai';
import { useEffect, useState } from 'react';
import { SHELTERS_MAP_ID } from '../../constants/app.constants';
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
import { toMapBounds } from '../../shared/components/map/utils/toMapBounds';
import {
  ShelterCard,
  TShelter,
} from '../../shared/components/shelter/shelterCard';
import { ShelterSearch } from '../../shared/components/shelters/shelterSearch';
import { ModalAnimationEnum } from '../../shared/modal/modal';

export function Home() {
  const [atomLocation, setLocation] = useAtom(locationAtom);
  const [_modal, setModal] = useAtom(modalAtom);
  const [shelters] = useAtom(sheltersAtom);
  const [shelterMarkers, setShelterMarkers] = useState<TMarker[]>([]);
  const [defaultCenter, setDefaultCenter] = useState<TLatLng>();
  const [showSearchButton, setShowSearchButton] = useState(false);
  const [mapBoundsFilter, setMapBoundsFilter] = useState<TMapBounds>();
  const [hasInitialized, setHasInitialized] = useState(false);
  const map = useMap();
  const mapBounds = map?.getBounds();

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

  const footerStyle = [
    'font-semibold',
    'text-sm',
    'text-center',
    'cursor-pointer',
    'text-primary-60',
    'active:text-primary-dark',
  ];

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
          footer={<div className={mergeCss(footerStyle)}>View Details</div>}
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

  function onSearchMapArea(bounds?: google.maps.LatLngBounds) {
    if (!bounds) {
      return;
    }

    setMapBoundsFilter(toMapBounds(bounds));
    setShowSearchButton(false);
  }

  const applyMapCenter = (
    lat: number,
    lng: number,
    source: 'address' | 'currentLocation'
  ) => {
    const location = { latitude: lat, longitude: lng };
    setDefaultCenter(location);
    setLocation({ ...location, source });
  };

  useEffect(() => {
    if (mapBounds) {
      setMapBoundsFilter(toMapBounds(mapBounds));
      setHasInitialized(true);
    }
  }, [atomLocation]);

  useEffect(() => {
    if (!mapBounds || hasInitialized) return;

    const savedCenter = sessionStorage.getItem('mapCenter');

    if (savedCenter) {
      const { lat, lng } = JSON.parse(savedCenter);
      applyMapCenter(lat, lng, 'address');
      return;
    }

    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          applyMapCenter(
            position.coords.latitude,
            position.coords.longitude,
            'currentLocation'
          );
        },
        () => {
          applyMapCenter(
            LA_COUNTY_CENTER.latitude,
            LA_COUNTY_CENTER.longitude,
            'address'
          );
        },
        { enableHighAccuracy: true, timeout: 5000 }
      );
    } else {
      applyMapCenter(
        LA_COUNTY_CENTER.latitude,
        LA_COUNTY_CENTER.longitude,
        'address'
      );
    }
  }, [mapBounds, hasInitialized]);

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
