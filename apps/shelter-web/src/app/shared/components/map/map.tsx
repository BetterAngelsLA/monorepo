import { CurrentLocationDot } from '@monorepo/react/components';
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
  const [userLocation, setUserLocation] =
    useState<google.maps.LatLngLiteral | null>(null);
  const [geolocationPermission, setGeolocationPermission] =
    useState<PermissionState | null>(null);
  const hasGrantedLocation = sessionStorage.getItem('hasGrantedLocation');

  useEffect(() => {
    console.info(`[map] loading status: ${mapApiStatus}`);
  }, [mapApiStatus]);

  const handleCameraChange = useCallback(
    (event: MapCameraChangedEvent) => {
      setCameraProps(event.detail);
    },
    [map]
  );

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

  useEffect(() => {
    let permissionStatus: PermissionStatus;
    const permissionQuery = navigator.permissions;

    if (!permissionQuery) {
      return;
    }

    permissionQuery
      .query({ name: 'geolocation' as PermissionName })
      .then((result) => {
        setGeolocationPermission(result.state);
        permissionStatus = result;

        result.onchange = () => {
          setGeolocationPermission(result.state);
        };
      });

    return () => {
      if (permissionStatus) {
        permissionStatus.onchange = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!map || !navigator.geolocation) return;

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        const newCenter = { lat: latitude, lng: longitude };
        setUserLocation(newCenter);
        sessionStorage.setItem('hasGrantedLocation', 'true');
      },
      (error) => {
        console.error('Geolocation error', error);
        sessionStorage.removeItem('hasGrantedLocation');

        setUserLocation(null);
      },
      { enableHighAccuracy: true }
    );
  }, [map, geolocationPermission]);

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
      {userLocation && (
        <AdvancedMarker position={userLocation} zIndex={999}>
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
          {hasGrantedLocation && (
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
