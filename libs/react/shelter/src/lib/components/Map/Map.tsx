/// <reference types="google.maps" />
import { CurrentLocationDot } from '@monorepo/react/components';
import { LockIcon, MapPinIcon } from '@monorepo/react/icons';
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
import { useCallback } from 'react';
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
import { useFitMapToPlaceViewport } from './useFitMapToPlaceViewport';
import {
  TLatLng,
  TMapBounds,
  TMapCamera,
  TMapGestureHandling,
  TMarker,
} from './types.maps';
import { toGoogleLatLng } from './utils/toGoogleLatLng';
import { toMapBounds } from './utils/toMapBounds';

type TMap = {
  mapId: string;
  className?: string;
  /** Controlled camera: the Map renders exactly this center + zoom. */
  center?: TLatLng | null;
  zoom?: number;
  /** Reports camera changes (user pan/zoom, fitBounds results) back up. */
  onCameraChange?: (camera: TMapCamera) => void;
  /** Fires whenever the map settles, with the actual rendered bounds. */
  onMapIdle?: (bounds: TMapBounds | null) => void;
  gestureHandling?: TMapGestureHandling;
  disableDefaultUI?: boolean;
  controlsPosition?: ControlPosition;
  showSearchButton?: boolean;
  userLocation?: TLatLng | null;
  showCurrentLocationBtn?: boolean;
  onCenterSelect?: (center: TLatLng) => void;
  onSearchMapArea?: (bounds?: google.maps.LatLngBounds) => void;
  markers?: TMarker[];
  /** Places API viewport to fit when the user completes a location search. */
  placeViewportToFit?: TMapBounds | null;
  onPlaceViewportFitted?: (actualBounds: TMapBounds) => void;
};

export function Map(props: TMap) {
  const {
    mapId,
    className = '',
    center,
    zoom,
    onCameraChange,
    onMapIdle,
    gestureHandling = DEFAULT_GESTURE_HANDLING,
    disableDefaultUI = true,
    controlsPosition = ControlPosition.INLINE_END_BLOCK_END,
    showSearchButton = false,
    userLocation,
    showCurrentLocationBtn = false,
    onCenterSelect,
    onSearchMapArea,
    markers = [],
    placeViewportToFit = null,
    onPlaceViewportFitted,
  } = props;
  const map = useMap();

  useFitMapToPlaceViewport({
    viewport: placeViewportToFit,
    onFitted: onPlaceViewportFitted,
  });

  const camera: MapCameraProps = {
    center: (center
      ? toGoogleLatLng(center)
      : LA_COUNTY_CENTER) as google.maps.LatLngLiteral,
    zoom: zoom ?? DEFAULT_MAP_ZOOM,
  };

  const handleCameraChange = useCallback(
    (event: MapCameraChangedEvent) => {
      const { center: c, zoom: z } = event.detail;
      onCameraChange?.({
        center: { latitude: c.lat, longitude: c.lng },
        zoom: z,
      });
    },
    [onCameraChange],
  );

  const handleIdle = useCallback(() => {
    const bounds = map?.getBounds();
    onMapIdle?.(bounds ? toMapBounds(bounds) : null);
  }, [map, onMapIdle]);

  function handleCenterToUserLocation(location: TLatLng) {
    // The camera is controlled by the parent; just notify it of the new center.
    onCenterSelect?.(location);
  }

  const userLocationLatLng = toGoogleLatLng(userLocation);

  const mapCss = ['h-12', 'w-full', className];
  return (
    <GoogleMap
      mapId={mapId}
      className={mergeCss(mapCss)}
      disableDefaultUI={disableDefaultUI}
      gestureHandling={gestureHandling}
      center={camera.center}
      zoom={camera.zoom}
      onCameraChanged={handleCameraChange}
      onIdle={handleIdle}
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
          <div className="relative">
            <MapPinIcon className="h-10" type={marker.type} />
            {marker.isPrivate && (
              <div className="absolute -top-1 -right-1 bg-white rounded-full p-0.5 shadow-sm">
                <LockIcon className="w-3 h-3 text-primary-60" />
              </div>
            )}
          </div>
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
