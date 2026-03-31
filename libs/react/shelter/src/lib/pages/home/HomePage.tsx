import { useLocationPermission } from '@monorepo/react/components';
import { mergeCss } from '@monorepo/react/shared';
import { useMap } from '@vis.gl/react-google-maps';
import { useAtom } from 'jotai';
import { useCallback, useEffect, useState } from 'react';
import { locationAtom, sheltersAtom } from '../../atoms';
import {
  DEFAULT_BOUNDS_MILES,
  LA_COUNTY_CENTER,
  MILES_TO_DEGREES_AT_EQUATOR,
  Map,
  ModalAnimationEnum,
  ShelterCard,
  ShelterSearch,
  TLatLng,
  TMapBounds,
  TMarker,
  TShelter,
  modalAtom,
  toGoogleLatLng,
  toMapBounds,
} from '../../components';
import { SHELTERS_MAP_ID } from '../../constants';
import { MaxWLayout } from '../../layout';

const FOOTER_STYLE = [
  'font-semibold',
  'text-sm',
  'text-center',
  'cursor-pointer',
  'text-primary-60',
  'active:text-primary-dark',
];
/**
 * Builds a LatLngBounds symmetric around the centroid of pins so `fitBounds`
 * centers the map on that centroid (not on a corner of an asymmetric cluster)
 * while keeping every pin inside the bounds, with a minimum padding radius.
 */

function symmetricBoundsAroundPinCentroid(
  pinLocations: TLatLng[]
): google.maps.LatLngBounds {
  const n = pinLocations.length;
  const centroidLat = pinLocations.reduce((sum, p) => sum + p.latitude, 0) / n;
  const centroidLng = pinLocations.reduce((sum, p) => sum + p.longitude, 0) / n;

  let maxHalfLatDeg = 0;
  let maxHalfLngDeg = 0;

  for (const p of pinLocations) {
    maxHalfLatDeg = Math.max(maxHalfLatDeg, Math.abs(p.latitude - centroidLat));
    maxHalfLngDeg = Math.max(
      maxHalfLngDeg,
      Math.abs(p.longitude - centroidLng)
    );
  }

  const minHalfLatDeg = DEFAULT_BOUNDS_MILES / 2 / MILES_TO_DEGREES_AT_EQUATOR;
  const cosLat = Math.cos((centroidLat * Math.PI) / 180) || 1e-6;
  const minHalfLngDeg =
    DEFAULT_BOUNDS_MILES / 2 / (MILES_TO_DEGREES_AT_EQUATOR * cosLat);

  const halfLat = Math.max(maxHalfLatDeg, minHalfLatDeg);
  const halfLng = Math.max(maxHalfLngDeg, minHalfLngDeg);

  const sw = {
    lat: centroidLat - halfLat,
    lng: centroidLng - halfLng,
  };
  const ne = {
    lat: centroidLat + halfLat,
    lng: centroidLng + halfLng,
  };

  return new google.maps.LatLngBounds(sw, ne);
}

export function HomePage() {
  const [location, setLocation] = useAtom(locationAtom);
  const [userLocation, setUserLocation] = useState<TLatLng | null>(null);
  const [_modal, setModal] = useAtom(modalAtom);
  const [shelters] = useAtom(sheltersAtom);
  const [shelterMarkers, setShelterMarkers] = useState<TMarker[]>([]);
  const [defaultCenter, setDefaultCenter] = useState<TLatLng>();
  const [showSearchButton, setShowSearchButton] = useState(false);
  const [mapBoundsFilter, setMapBoundsFilter] = useState<TMapBounds>();
  const [hasInitialized, setHasInitialized] = useState(false);
  const [nameSearchPinFitRequestId, setNameSearchPinFitRequestId] = useState(0);
  const map = useMap();
  const hasLocationPermission = useLocationPermission();

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
            footer={<div className={mergeCss(FOOTER_STYLE)}>View Details</div>}
          />
        ),
        animation: ModalAnimationEnum.EXPAND,
        closeOnMaskClick: true,
      });
    },
    [setModal, shelters]
  );

  const onShelterPinsReadyForMapFit = useCallback(
    (pinLocations: TLatLng[]) => {
      if (!map || !pinLocations.length) {
        return;
      }

      const bounds = symmetricBoundsAroundPinCentroid(pinLocations);
      map.fitBounds(bounds);
    },
    [map]
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

          applyMapCenter(latitude, longitude, 'currentLocation');
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
  }, [map, hasInitialized, applyMapCenter]);

  function onNameSearch() {
    setMapBoundsFilter(undefined);
    setShowSearchButton(false);
    setNameSearchPinFitRequestId((n) => n + 1);
  }

  return (
    <>
      <MaxWLayout className="-mx-4">
        <Map
          defaultCenter={defaultCenter}
          className="h-[70vh] md:h-80"
          mapId={SHELTERS_MAP_ID}
          markers={shelterMarkers}
          userLocation={userLocation}
          showCurrentLocationBtn={hasLocationPermission}
          showSearchButton={showSearchButton}
          setShowSearchButton={setShowSearchButton}
          onCenterSelect={onCenterSelect}
          onSearchMapArea={onSearchMapArea}
        />
      </MaxWLayout>
      <ShelterSearch
        mapBoundsFilter={mapBoundsFilter}
        nameSearchPinFitRequestId={nameSearchPinFitRequestId}
        onShelterPinsReadyForMapFit={onShelterPinsReadyForMapFit}
        onNameSearch={onNameSearch}
      />
    </>
  );
}
