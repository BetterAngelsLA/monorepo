import { MapPinIcon } from '@monorepo/react/icons';

import {
  AdvancedMarker,
  ControlPosition,
  Map as GoogleMap,
  MapCameraChangedEvent,
  MapCameraProps,
  MapControl,
  useApiLoadingStatus,
  useMap,
} from '@vis.gl/react-google-maps';
import {
  Dispatch,
  SetStateAction,
  useCallback,
  useEffect,
  useState,
} from 'react';
import { mergeCss } from '../../utils/styles/mergeCss';
import {
  DEFAULT_GESTURE_HANDLING,
  DEFAULT_MAP_ZOOM,
  LA_COUNTY_CENTER,
} from './constants.maps';
import { CurrentLocationBtn } from './controls/currentLocationBtn';
import { SearchMapAreaButton } from './controls/searchMapAreaButton';
import { ZoomControls } from './controls/zoomControls';
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
    onCenterSelect,
    onSearchMapArea,
    markers = [],
  } = props;
  const map = useMap();
  const mapApiStatus = useApiLoadingStatus();

  const [cameraProps, setCameraProps] = useState<MapCameraProps>({
    center: toGoogleLatLng(defaultCenter) as google.maps.LatLngLiteral,
    zoom: defaultZoom,
  });

  useEffect(() => {
    console.info(`[map] loading status: ${mapApiStatus}`);
  }, [mapApiStatus]);

  const handleCameraChange = useCallback(
    (event: MapCameraChangedEvent) => {
      setCameraProps(event.detail);
      const { center } = event.detail;

      if (center) {
        sessionStorage.setItem(
          'mapCenter',
          JSON.stringify({
            lat: center.lat,
            lng: center.lng,
          })
        );
      }
    },
    [map]
  );

  function onCurrentLocationChange(location: TLatLng) {
    if (!map) {
      console.warn('[map::onCurrentLocationChange] map missing.');

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
          <CurrentLocationBtn
            className="mt-5"
            onLocationSucccess={onCurrentLocationChange}
          />
        </div>
      </MapControl>
    </GoogleMap>
  );
}
