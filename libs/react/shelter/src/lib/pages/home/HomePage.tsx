import { useLocationPermission } from '@monorepo/react/components';
import { mergeCss } from '@monorepo/react/shared';
import { useMap } from '@vis.gl/react-google-maps';
import { useAtom, useSetAtom } from 'jotai';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Outlet } from 'react-router-dom';
import { ShelterChoices } from '../../apollo';
import {
  shelterLocationSearchInputAtom,
  shelterSearchAppliedLocationAtom,
  shelterSearchPendingLocationAtom,
  shelterSearchTriggerAtom,
  sheltersAtom,
} from '../../atoms';
import {
  DEFAULT_BOUNDS_MILES,
  LA_COUNTY_CENTER,
  LoginBanner,
  MILES_TO_DEGREES_AT_EQUATOR,
  Map,
  ModalAnimationEnum,
  ShelterCard,
  ShelterSearch,
  TLatLng,
  TMapBounds,
  TMarker,
  TShelter,
  mapBoundsFromCenter,
  modalAtom,
  toGoogleLatLng,
  toMapBounds,
} from '../../components';
import { SHELTERS_MAP_ID } from '../../constants';
import { MaxWLayout } from '../../layout';
import { useUser } from '../../providers';

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
  const { user } = useUser();
  const [location, setLocation] = useState<TLatLng | null>(null);
  const [userLocation, setUserLocation] = useState<TLatLng | null>(null);
  const [_modal, setModal] = useAtom(modalAtom);
  const [shelters] = useAtom(sheltersAtom);
  const [shelterMarkers, setShelterMarkers] = useState<TMarker[]>([]);
  const [defaultCenter, setDefaultCenter] = useState<TLatLng>();
  const [showSearchButton, setShowSearchButton] = useState(false);
  const [mapBoundsFilter, setMapBoundsFilter] = useState<TMapBounds>();
  const [hasInitialized, setHasInitialized] = useState(false);
  const [nameSearchPinFitRequestId, setNameSearchPinFitRequestId] = useState(0);
  const [placeViewportToFit, setPlaceViewportToFit] =
    useState<TMapBounds | null>(null);
  const setSearchTrigger = useSetAtom(shelterSearchTriggerAtom);
  const setPendingLocation = useSetAtom(shelterSearchPendingLocationAtom);
  const setAppliedLocation = useSetAtom(shelterSearchAppliedLocationAtom);
  const setLocationSearchInput = useSetAtom(shelterLocationSearchInputAtom);
  const map = useMap();
  const hasLocationPermission = useLocationPermission();
  /** Skips one location-effect map sync when viewport fit handles center/zoom. */
  const skipNextLocationMapSyncRef = useRef(false);

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

  const onPlaceViewportFitted = useCallback(
    (actualBounds: TMapBounds) => {
      // Use actual post-fit map bounds (not the Place's viewport) so the query
      // covers everything visible on screen, then fire the search.
      setMapBoundsFilter(actualBounds);
      setPlaceViewportToFit(null);
      setSearchTrigger((n) => n + 1);
    },
    [setSearchTrigger]
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
          type: shelter.shelterTypes?.find(
            (t) => t.name === ShelterChoices.AccessCenter
          )
            ? 'purple'
            : 'secondary',
          isPrivate: shelter.isPrivate,
        } as TMarker;
      });

    setShelterMarkers(markers);
  }, [handleClick, shelters]);

  function onCenterSelect(center: TLatLng) {
    setUserLocation(center);
    setLocation({
      ...center,
    });
  }

  function onSearchMapArea(bounds?: google.maps.LatLngBounds) {
    if (!bounds) {
      return;
    }

    setPendingLocation(null);
    setAppliedLocation(null);
    setLocationSearchInput('');
    setMapBoundsFilter(toMapBounds(bounds));
    setShowSearchButton(false);
    setSearchTrigger((n) => n + 1);
  }

  const applyMapCenter = useCallback(
    (lat: number, lng: number) => {
      const location = { latitude: lat, longitude: lng };
      setDefaultCenter(location);
      setLocation(location);
    },
    [setLocation]
  );

  useEffect(() => {
    if (!map || !location) return;

    if (skipNextLocationMapSyncRef.current) {
      skipNextLocationMapSyncRef.current = false;
      return;
    }

    const center = toGoogleLatLng(location);

    if (center) {
      map.setCenter(center);
    }

    const bounds = map.getBounds();

    if (bounds) {
      setMapBoundsFilter(toMapBounds(bounds));
      setSearchTrigger((n) => n + 1);
      return;
    }

    const listener = map.addListener('idle', () => {
      const idleBounds = map.getBounds();

      if (idleBounds) {
        setMapBoundsFilter(toMapBounds(idleBounds));
        setSearchTrigger((n) => n + 1);
      }

      listener.remove();
    });

    return () => listener.remove();
  }, [map, location, setSearchTrigger]);

  useEffect(() => {
    if (!map || hasInitialized) return;
    setHasInitialized(true);

    const savedCenter = sessionStorage.getItem('mapCenter');

    if (savedCenter) {
      const { lat, lng } = JSON.parse(savedCenter);
      applyMapCenter(lat, lng);
      return;
    }

    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;

          setUserLocation({ latitude, longitude });

          applyMapCenter(latitude, longitude);
        },
        () => {
          applyMapCenter(LA_COUNTY_CENTER.latitude, LA_COUNTY_CENTER.longitude);
        },
        { enableHighAccuracy: true, timeout: 5000 }
      );
    } else {
      applyMapCenter(LA_COUNTY_CENTER.latitude, LA_COUNTY_CENTER.longitude);
    }
  }, [map, hasInitialized, applyMapCenter]);

  function setSearchLocation(location: TLatLng, mapBounds?: TMapBounds) {
    setShowSearchButton(false);
    setLocation(location);

    if (mapBounds) {
      // Skip the location useEffect's map-sync so it doesn't overwrite bounds.
      // onPlaceViewportFitted will set mapBoundsFilter and fire the search
      // once the map has fully settled (idle) after fitBounds.
      skipNextLocationMapSyncRef.current = true;
      setPlaceViewportToFit(mapBounds);
      return;
    }

    setMapBoundsFilter(mapBoundsFromCenter(location));
    setPlaceViewportToFit(null);
  }

  function onNameSearch(options?: {
    preserveMapBounds?: boolean;
    restoreMapBounds?: boolean;
  }) {
    if (options?.preserveMapBounds) {
      // Name + location: the search will be triggered by onPlaceViewportFitted
      // after the map settles on the actual rendered bounds.
      setShowSearchButton(false);
      return;
    }

    if (options?.restoreMapBounds) {
      // Name cleared: restore the current visible map area as the bounds filter
      // so results return to the map-area view instead of staying blank.
      const currentBounds = map?.getBounds();
      if (currentBounds) {
        setMapBoundsFilter(toMapBounds(currentBounds));
      }
      setShowSearchButton(false);
      setSearchTrigger((n) => n + 1);
      return;
    }

    // Name only: clear any stale map bounds, then fire immediately.
    setMapBoundsFilter(undefined);
    setNameSearchPinFitRequestId((n) => n + 1);
    setShowSearchButton(false);
    setSearchTrigger((n) => n + 1);
  }

  return (
    <>
      <MaxWLayout className="-mx-4 relative">
        {!user && <LoginBanner />}
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
          placeViewportToFit={placeViewportToFit}
          onPlaceViewportFitted={onPlaceViewportFitted}
        />
      </MaxWLayout>
      <ShelterSearch
        mapBoundsFilter={mapBoundsFilter}
        nameSearchPinFitRequestId={nameSearchPinFitRequestId}
        onShelterPinsReadyForMapFit={onShelterPinsReadyForMapFit}
        onNameSearch={onNameSearch}
        setLocation={setSearchLocation}
      />
      <Outlet />
    </>
  );
}
