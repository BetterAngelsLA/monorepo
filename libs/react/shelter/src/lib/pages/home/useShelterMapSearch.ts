import { useMap } from '@vis.gl/react-google-maps';
import { useAtom, useSetAtom } from 'jotai';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  savedMapViewportAtom,
  shelterLocationSearchInputAtom,
  shelterMapBoundsFilterAtom,
  shelterSearchAppliedLocationAtom,
  shelterSearchPendingLocationAtom,
  shelterSearchTriggerAtom,
} from '../../atoms';
import { DEFAULT_MAP_ZOOM, LA_COUNTY_CENTER } from '../../components/Map/constants.maps';
import { TLatLng, TMapBounds, TMapCamera } from '../../components/Map/types.maps';
import {
  mapBoundsFromCenter,
  sameMapBounds,
  symmetricBoundsAroundPinCentroid,
  toMapBounds,
} from '../../components/Map/utils';

export type TShelterNameSearchOptions = {
  preserveMapBounds?: boolean;
  restoreMapBounds?: boolean;
};

/**
 * Owns the shelter map + search orchestration for the home page: the
 * controlled camera (with refs so effects can read values without
 * subscribing), the location/geolocation sync, the map-area search, and the
 * "don't re-query unchanged viewports" skip-guard when returning from a
 * shelter detail page. Extracted from HomePage so this logic is unit-testable.
 */
export function useShelterMapSearch() {
  const [location, setLocation] = useState<TLatLng | null>(null);
  const [userLocation, setUserLocation] = useState<TLatLng | null>(null);
  // Restore the exact viewport saved before navigating to a shelter detail
  // page: the Map mounts at the saved camera so the visible pins and result
  // count are unchanged on return.
  const [savedViewport, setSavedMapViewport] = useAtom(savedMapViewportAtom);
  const [camera, setCameraState] = useState<TMapCamera>(() => ({
    center: savedViewport?.center ?? LA_COUNTY_CENTER,
    zoom: savedViewport?.zoom ?? DEFAULT_MAP_ZOOM,
  }));
  const cameraRef = useRef<TMapCamera>(camera);
  /** Set the controlled camera, keeping a ref in sync for the location effect. */
  const setCamera = useCallback((next: TMapCamera) => {
    cameraRef.current = next;
    setCameraState(next);
  }, []);
  /** True while a programmatic camera move awaits the map's idle search. */
  const pendingLocationSearchRef = useRef(false);
  const [showSearchButton, setShowSearchButton] = useState(false);
  // Persisted as an atom so the exact previously-searched bounds survive a
  // shelter-detail round trip: the query re-runs with identical variables and
  // Apollo's cache-first policy serves it without a network request.
  const [mapBoundsFilter, setMapBoundsFilter] = useAtom(
    shelterMapBoundsFilterAtom
  );
  // Mirrors the persisted bounds so the location effect can compare without
  // subscribing (same pattern as cameraRef); seeded from the atom so it
  // survives HomePage remounts after returning from a shelter detail page.
  const lastSearchedBoundsRef = useRef<TMapBounds | undefined>(mapBoundsFilter);
  /** Sets the map bounds filter, keeping the last-searched ref in sync. */
  const setMapBounds = useCallback(
    (bounds: TMapBounds | undefined) => {
      lastSearchedBoundsRef.current = bounds;
      setMapBoundsFilter(bounds);
    },
    [setMapBoundsFilter]
  );
  const [hasInitialized, setHasInitialized] = useState(false);
  const [nameSearchPinFitRequestId, setNameSearchPinFitRequestId] = useState(0);
  const [placeViewportToFit, setPlaceViewportToFit] =
    useState<TMapBounds | null>(null);
  const setSearchTrigger = useSetAtom(shelterSearchTriggerAtom);
  const setPendingLocation = useSetAtom(shelterSearchPendingLocationAtom);
  const setAppliedLocation = useSetAtom(shelterSearchAppliedLocationAtom);
  const setLocationSearchInput = useSetAtom(shelterLocationSearchInputAtom);
  const map = useMap();
  /** Skips one location-effect map sync when viewport fit handles center/zoom. */
  const skipNextLocationMapSyncRef = useRef(false);

  /** Fires a search for the given rendered bounds (single map-area search primitive). */
  const fireSearchForBounds = useCallback(
    (bounds: TMapBounds) => {
      setMapBounds(bounds);
      setSearchTrigger((n) => n + 1);
    },
    [setMapBounds, setSearchTrigger]
  );

  /**
   * Fires whenever the map settles: reveal the search button and, if a
   * programmatic camera move is pending, fire the search with the actual
   * rendered bounds so the result total matches what's visible.
   */
  const handleMapIdle = useCallback(
    (bounds: TMapBounds | null) => {
      setShowSearchButton(true);
      if (pendingLocationSearchRef.current) {
        pendingLocationSearchRef.current = false;
        if (bounds) {
          fireSearchForBounds(bounds);
        }
      }
    },
    [fireSearchForBounds]
  );

  const onPlaceViewportFitted = useCallback(
    (actualBounds: TMapBounds) => {
      // Use actual post-fit map bounds (not the Place's viewport) so the query
      // covers everything visible on screen, then fire the search.
      setPlaceViewportToFit(null);
      fireSearchForBounds(actualBounds);
    },
    [fireSearchForBounds]
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
    fireSearchForBounds(toMapBounds(bounds));
    setShowSearchButton(false);
  }

  const applyMapCenter = useCallback(
    (lat: number, lng: number) => {
      // Only the location drives the camera once the Map is mounted (the
      // location effect updates the controlled camera); the initial camera
      // comes from the camera state above.
      setLocation({ latitude: lat, longitude: lng });
    },
    [setLocation]
  );

  useEffect(() => {
    if (!map || !location) return;

    if (skipNextLocationMapSyncRef.current) {
      skipNextLocationMapSyncRef.current = false;
      return;
    }

    const alreadyCentered =
      cameraRef.current.center.latitude === location.latitude &&
      cameraRef.current.center.longitude === location.longitude;

    if (alreadyCentered) {
      // The camera is already at the location (e.g. a restored viewport or a
      // repeat). Search immediately with the current rendered bounds -- unless
      // they match the last search, in which case the results (and Apollo
      // cache entry) are already up to date, so skip the redundant request.
      const bounds = map.getBounds();
      if (
        bounds &&
        !sameMapBounds(toMapBounds(bounds), lastSearchedBoundsRef.current)
      ) {
        fireSearchForBounds(toMapBounds(bounds));
      }
      return;
    }

    // Move the controlled camera to the location; the search fires once the
    // map settles (see handleMapIdle) with the actual rendered bounds.
    setCamera({ ...cameraRef.current, center: location });
    pendingLocationSearchRef.current = true;
  }, [map, location, fireSearchForBounds, setCamera]);

  useEffect(() => {
    if (!map || hasInitialized) return;
    setHasInitialized(true);

    if (savedViewport) {
      // Consume so it isn't re-applied on navigations that didn't originate
      // from a shelter detail page. The Map already mounted at the saved
      // camera (see the camera state above); set the location so the location
      // effect fires a search with the restored viewport's actual bounds.
      setSavedMapViewport(null);
      applyMapCenter(
        savedViewport.center.latitude,
        savedViewport.center.longitude
      );
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
  }, [map, hasInitialized, savedViewport, setSavedMapViewport, applyMapCenter]);

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

    setMapBounds(mapBoundsFromCenter(location));
    setPlaceViewportToFit(null);
  }

  function onNameSearch(options?: TShelterNameSearchOptions) {
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
        fireSearchForBounds(toMapBounds(currentBounds));
      }
      setShowSearchButton(false);
      return;
    }

    // Name only: clear any stale map bounds, then fire immediately.
    setMapBounds(undefined);
    setNameSearchPinFitRequestId((n) => n + 1);
    setShowSearchButton(false);
    setSearchTrigger((n) => n + 1);
  }

  return {
    camera,
    onCameraChange: setCamera,
    onMapIdle: handleMapIdle,
    showSearchButton,
    userLocation,
    onCenterSelect,
    onSearchMapArea,
    placeViewportToFit,
    onPlaceViewportFitted,
    mapBoundsFilter,
    nameSearchPinFitRequestId,
    onShelterPinsReadyForMapFit,
    onNameSearch,
    setSearchLocation,
  };
}
