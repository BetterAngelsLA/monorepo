import { mergeCss } from '@monorepo/react/shared';
import { useMap } from '@vis.gl/react-google-maps';
import { useAtom } from 'jotai';
import { useCallback, useEffect, useState } from 'react';
import { SHELTERS_MAP_ID } from '../../constants/app.constants';
import { MaxWLayout } from '../../layout/maxWLayout';
import { locationAtom } from '../../shared/atoms/locationAtom';
import { modalAtom } from '../../shared/atoms/modalAtom';
import { sheltersAtom } from '../../shared/atoms/sheltersAtom';
import {
  LA_COUNTY_CENTER,
  Map,
  TLatLng,
  TMapBounds,
  TMarker,
  toGoogleLatLng,
  toMapBounds,
} from '@monorepo/react/components';
import {
  ShelterCard,
  TShelter,
} from '../../shared/components/shelter/shelterCard';
import { ShelterSearch } from '../../shared/components/shelters/shelterSearch';
import { ModalAnimationEnum } from '../../shared/modal/modal';

const FOOTER_STYLE = [
  'font-semibold',
  'text-sm',
  'text-center',
  'cursor-pointer',
  'text-primary-60',
  'active:text-primary-dark',
];

export function Home() {
  const [location, setLocation] = useAtom(locationAtom);
  const [userLocation, setUserLocation] = useState<TLatLng | null>(null);
  const [_modal, setModal] = useAtom(modalAtom);
  const [shelters] = useAtom(sheltersAtom);
  const [shelterMarkers, setShelterMarkers] = useState<TMarker[]>([]);
  const [defaultCenter, setDefaultCenter] = useState<TLatLng>();
  const [showSearchButton, setShowSearchButton] = useState(false);
  const [mapBoundsFilter, setMapBoundsFilter] = useState<TMapBounds>();
  const [hasInitialized, setHasInitialized] = useState(false);
  const map = useMap();

  const handleClick = useCallback(
    (markerId: string | null | undefined) => {
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
            footer={
              <div className={mergeCss(FOOTER_STYLE)}>View Details</div>
            }
          />
        ),
        animation: ModalAnimationEnum.EXPAND,
        closeOnMaskClick: true,
      });
    },
    [setModal, shelters]
  );

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
  }, [handleClick, shelters]);

  function onCenterSelect(center: TLatLng) {
    setUserLocation(center);
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

  const applyMapCenter = useCallback(
    (lat: number, lng: number, source: 'address' | 'currentLocation') => {
      const location = { latitude: lat, longitude: lng };
      setDefaultCenter(location);
      setLocation({ ...location, source });
    },
    [setLocation]
  );

  useEffect(() => {
    if (!map || !location) return;

    const center = toGoogleLatLng(location);

    if (center) {
      map.setCenter(center);
    }

    const bounds = map.getBounds();

    if (bounds) {
      setMapBoundsFilter(toMapBounds(bounds));
    }
  }, [map, location]);

  useEffect(() => {
    if (!map || hasInitialized) return;
    setHasInitialized(true);

    const savedCenter = sessionStorage.getItem('mapCenter');

    if (savedCenter) {
      const { lat, lng } = JSON.parse(savedCenter);
      applyMapCenter(lat, lng, 'address');
      return;
    }

    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;

          setUserLocation({ latitude, longitude });
          sessionStorage.setItem('hasGrantedLocation', 'true');

          applyMapCenter(latitude, longitude, 'currentLocation');
        },
        () => {
          sessionStorage.removeItem('hasGrantedLocation');

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
  }, [map, hasInitialized, applyMapCenter]);

  return (
    <>
      <MaxWLayout className="-mx-4">
        <Map
          defaultCenter={defaultCenter}
          className="h-[70vh] md:h-80"
          mapId={SHELTERS_MAP_ID}
          markers={shelterMarkers}
          userLocation={userLocation}
          showCurrentLocationBtn={!!sessionStorage.getItem('hasGrantedLocation')}
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
