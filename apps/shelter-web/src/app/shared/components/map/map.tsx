import { CurrentLocationDot } from '@monorepo/react/components';
import {
  AdvancedMarker,
  Map as GoogleMap,
  MapCameraChangedEvent,
  MapCameraProps,
  useMap,
} from '@vis.gl/react-google-maps';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  DEFAULT_GESTURE_HANDLING,
  DEFAULT_MAP_ZOOM,
  LA_COUNTY_CENTER,
} from './constants.maps';
import { MapMarkers } from './controls/mapMarkers';
import { SearchAreaControl } from './controls/searchAreaControl';
import { ZoomAndLocateControls } from './controls/zoomAndLocateControls';
import { useMapLifecycle } from './hooks/useMapLifecycle';
import { useUserLocation } from './hooks/useUserLocation';
import {
  LatLngLiteral,
  TMapGestureHandling,
  TMapState,
  TMapZoom,
  TMarker,
} from './types.maps';
import { getMapState } from './utils/getMapState';
import { toGoogleLatLngLiteral } from './utils/toGoogleLatLngLiteral';

const INITIAL_CAMERA = {
  center: toGoogleLatLngLiteral(LA_COUNTY_CENTER),
  zoom: 13,
};

type TMap = {
  mapId: string;
  defaultCenter: LatLngLiteral;
  targetCenter?: LatLngLiteral | null;
  className?: string;
  defaultZoom?: TMapZoom;
  forcedZoom?: TMapZoom;
  markers?: TMarker[];
  enableUseUserLocation?: boolean;
  gestureHandling?: TMapGestureHandling;
  disableDefaultUI?: boolean;
  onInit?: (mapState: TMapState) => void;
  onCenterInit?: (mapState: TMapState) => void;
  onIdle?: (mapState: TMapState | null) => void;
  onLocateMeClick?: (mapState: TMapState) => void;
  onSearchMapArea?: (mapState: TMapState) => void;
};

export function Map(props: TMap) {
  const {
    mapId,
    className,
    defaultCenter,
    targetCenter,
    markers = [],
    defaultZoom = DEFAULT_MAP_ZOOM,
    forcedZoom,
    disableDefaultUI = true,
    gestureHandling = DEFAULT_GESTURE_HANDLING,
    enableUseUserLocation = false,
    onInit,
    onIdle,
    onCenterInit,
    onSearchMapArea,
    onLocateMeClick,
  } = props;
  const map = useMap();
  const pendingLocate = useRef(false);

  const { userLocation, fetchLocation } = useUserLocation(
    enableUseUserLocation,
    !!map
  );

  useMapLifecycle(userLocation, onInit, onIdle, onCenterInit);
  // useCenterSync(userLocation);

  const [cameraProps, setCameraProps] =
    useState<MapCameraProps>(INITIAL_CAMERA);

  const handleCameraChange = useCallback(
    (ev: MapCameraChangedEvent) => {
      setCameraProps(ev.detail);

      if (pendingLocate.current) {
        onLocateMeClick?.(getMapState(map)!);

        pendingLocate.current = false;
      }
    },
    [onLocateMeClick]
  );

  // useEffect(() => {
  //   if (!map || !desiredCenter) {
  //     return;
  //   }

  //   map.setCenter(desiredCenter);

  //   onUserLocationChange?.(getMapState(map)!);
  // }, [map, desiredCenter, onUserLocationChange]);

  // one handler that both recenters immediately on the last-known loc
  // and kicks off a fresh fetch
  // const handleLocateClick = useCallback(() => {
  //   console.log('############### handleLocateClick: ', userLocation);
  //   if (!map) {
  //     return;
  //   }
  //   // if (!map || !userLocation) {
  //   //   fetchLocation();

  //   //   return;
  //   // }

  //   // if (map && userLocation) {
  //   //   setCameraProps((prev) => ({
  //   //     ...prev,
  //   //     center: userLocation,
  //   //   }));

  //   //   onLocateMeClick?.(getMapState(map)!);
  //   // }

  //   const idleListener = map.addListener('idle', () => {
  //     console.log('################################### FIRE onLocateMeClick');
  //     console.log(getMapState(map));
  //     onLocateMeClick?.(getMapState(map)!);

  //     idleListener.remove();
  //   });

  //   fetchLocation();
  // }, [map, userLocation, fetchLocation, onLocateMeClick]);

  const handleLocateClick = useCallback(() => {
    console.log('--------- handleLocateClick: ', userLocation);
    if (userLocation) {
      pendingLocate.current = true;

      setCameraProps((prev) => ({
        ...prev,
        center: userLocation,
      }));
    }

    fetchLocation();
  }, [userLocation, fetchLocation]);

  const desiredCenter = targetCenter ?? userLocation;

  // console.log('*********  desiredCenter:', desiredCenter);

  useEffect(() => {
    if (!desiredCenter) {
      return;
    }

    setCameraProps((prev) => ({
      ...prev,
      center: desiredCenter,
    }));
  }, [desiredCenter?.lat, desiredCenter?.lng]);

  useEffect(() => {
    console.log('**********  userLocation:', userLocation);
    if (!userLocation) {
      return;
    }

    // setCameraProps((prev) => ({
    //   ...prev,
    //   center: desiredCenter,
    // }));
  }, [userLocation?.lat, userLocation?.lng]);

  useEffect(() => {
    if (targetCenter) {
      setCameraProps((prev) => ({
        ...prev,
        center: targetCenter,
      }));
    }
  }, [targetCenter]);

  const parentCss = `h-12 w-full ${className}`;

  return (
    <GoogleMap
      mapId={mapId}
      className={parentCss}
      disableDefaultUI={disableDefaultUI}
      gestureHandling={gestureHandling}
      onCameraChanged={handleCameraChange}
      {...cameraProps}
    >
      {userLocation && (
        <AdvancedMarker position={userLocation} zIndex={999}>
          <CurrentLocationDot />
        </AdvancedMarker>
      )}

      <MapMarkers markers={markers} />

      <SearchAreaControl onSearchMapArea={onSearchMapArea!} />

      <ZoomAndLocateControls onLocate={handleLocateClick} />
    </GoogleMap>
  );
}
