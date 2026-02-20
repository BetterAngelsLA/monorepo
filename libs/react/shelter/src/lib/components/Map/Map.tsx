/// <reference types="google.maps" />

import { CurrentLocationDot } from '@monorepo/react/components';
import { MapPinIcon } from '@monorepo/react/icons';
import { mergeCss } from '@monorepo/react/shared';
import {
  AdvancedMarker,
  ControlPosition,
  Map as GoogleMap,
  MapCameraChangedEvent,
  MapCameraProps,
  MapControl,
  useMap,
} from '@vis.gl/react-google-maps';
import { Dispatch, SetStateAction, useCallback, useState } from 'react';
import {
  DEFAULT_GESTURE_HANDLING,
  DEFAULT_MAP_ZOOM,
  LA_COUNTY_CENTER,
} from './constants.maps';
import {
  CurrentLocationBtn,
  SearchMapAreaButton,
  ZoomControls,
} from './controls';
import { TLatLng, TMapGestureHandling, TMapZoom, TMarker } from './types.maps';
import { toGoogleLatLng } from './utils/toGoogleLatLng';

type TMap = {
  mapId: string;
  className?: string;
  defaultCenter?: TLatLng | google.maps.LatLngLiteral | null;
  defaultZoom?: TMapZoom;
  gestureHandling?: TMapGestureHandling;
  disableDefaultUI?: boolean;
  controlsPosition?: ControlPosition;
  showSearchButton?: boolean;
  setShowSearchButton: Dispatch<SetStateAction<boolean>>;
  userLocation?: TLatLng | null;
  showCurrentLocationBtn?: boolean;
  onCenterSelect?: (center: TLatLng) => void;
  onSearchMapArea?: (bounds?: google.maps.LatLngBounds) => void;
  markers?: TMarker[];
};

export function Map(props: TMap) {
  const {
    mapId,
    className = '',
    defaultZoom = DEFAULT_MAP_ZOOM,
    defaultCenter = LA_COUNTY_CENTER,
    gestureHandling = DEFAULT_GESTURE_HANDLING,
    disableDefaultUI = true,
    controlsPosition = ControlPosition.INLINE_END_BLOCK_END,
    showSearchButton = false,
    setShowSearchButton,
    userLocation,
    showCurrentLocationBtn = false,
    onCenterSelect,
    onSearchMapArea,
    markers = [],
  } = props;
  const map = useMap();

  const [cameraProps, setCameraProps] = useState<MapCameraProps>({
    center: toGoogleLatLng(defaultCenter) as google.maps.LatLngLiteral,
    zoom: defaultZoom,
  });

  const handleCameraChange = useCallback((event: MapCameraChangedEvent) => {
    setCameraProps(event.detail);
  }, []);

  function handleCenterToUserLocation(location: TLatLng) {
    if (!map) {
      console.warn('[map::handleCenterToUserLocation] map missing.');

      return;
    }

    const { latitude, longitude } = location;

    const newCenter = {
      lat: latitude,
      lng: longitude,
    };

    onCenterSelect &&
      onCenterSelect({
        latitude,
        longitude,
      });

    map.setCenter(newCenter);
  }

  const userLocationLatLng = toGoogleLatLng(userLocation);

  const mapCss = ['h-12', 'w-full', className];
  return (
    <GoogleMap
      mapId={mapId}
      className={mergeCss(mapCss)}
      disableDefaultUI={disableDefaultUI}
      gestureHandling={gestureHandling}
      onCameraChanged={handleCameraChange}
      onIdle={() => setShowSearchButton(true)}
      {...cameraProps}
    >
      {userLocationLatLng && (
        <AdvancedMarker position={userLocationLatLng} zIndex={999}>
          <CurrentLocationDot />
        </AdvancedMarker>
      )}
      {markers.map((marker) => (
        <AdvancedMarker
          key={marker.id}
          position={toGoogleLatLng(marker.position)}
          zIndex={99}
          onClick={marker.onClick}
        >
          <MapPinIcon className="h-10" type="secondary" />
        </AdvancedMarker>
      ))}

      {showSearchButton && onSearchMapArea && (
        <MapControl position={ControlPosition.TOP_CENTER}>
          <SearchMapAreaButton
            onClick={() => onSearchMapArea(map?.getBounds())}
          />
        </MapControl>
      )}

      <MapControl position={controlsPosition}>
        <div className="mr-4">
          <ZoomControls />
          {showCurrentLocationBtn && (
            <CurrentLocationBtn
              className="mt-5"
              onLocationSuccess={handleCenterToUserLocation}
            />
          )}
        </div>
      </MapControl>
    </GoogleMap>
  );
}
