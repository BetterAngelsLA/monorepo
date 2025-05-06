import { CurrentLocationDot } from '@monorepo/react/components';
import {
  AdvancedMarker,
  Map as GoogleMap,
  useMap,
} from '@vis.gl/react-google-maps';
import { useState } from 'react';
import { DEFAULT_GESTURE_HANDLING, DEFAULT_MAP_ZOOM } from './constants.maps';
import { MapMarkers } from './controls/mapMarkers';
import { SearchAreaControl } from './controls/searchAreaControl';
import { ZoomAndLocateControls } from './controls/zoomAndLocateControls';
import { useCenterSync } from './hooks/useCenterSync';
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
import { setMapCenter } from './utils/setMapCenter';

type TMap = {
  mapId: string;
  defaultCenter: LatLngLiteral;
  className?: string;
  defaultZoom?: TMapZoom;
  markers?: TMarker[];
  enableUseUserLocation?: boolean;
  gestureHandling?: TMapGestureHandling;
  disableDefaultUI?: boolean;
  onInit?: (mapState: TMapState) => void;
  onCenterInit?: (mapState: TMapState) => void;
  onIdle?: (mapState: TMapState | null) => void;
  onSearchMapArea?: (bounds?: google.maps.LatLngBounds) => void;
  onLocateMeClick?: (mapState: TMapState) => void;
};

export function Map(props: TMap) {
  const {
    mapId,
    className,
    defaultCenter,
    markers = [],
    defaultZoom = DEFAULT_MAP_ZOOM,
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

  const [searchBtnVisible, setSearchBtnVisible] = useState(false);

  const { userLocation, fetchLocation } = useUserLocation({
    enabled: enableUseUserLocation,
    initialized: !!map,
    onLocateMeClick: (location: LatLngLiteral) => {
      console.log(
        '################################### map.setCenter ON LOCATE_ME CLICK'
      );
      setMapCenter({
        center: location,
        map,
        onCenterSet: () => {
          const state = getMapState(map);

          if (state) {
            onLocateMeClick?.(state);
          }
        },
      });
    },
  });

  useMapLifecycle(userLocation, onInit, onIdle, onCenterInit);
  useCenterSync(userLocation);

  function onDragZoomChange() {
    setSearchBtnVisible(true);
  }

  const classes = `h-12 w-full ${className}`;

  return (
    <GoogleMap
      mapId={mapId}
      className={classes}
      disableDefaultUI={disableDefaultUI}
      gestureHandling={gestureHandling}
      defaultCenter={defaultCenter}
      defaultZoom={defaultZoom}
      onDragend={onDragZoomChange}
      onZoomChanged={onDragZoomChange}
    >
      {userLocation && (
        <AdvancedMarker position={userLocation} zIndex={999}>
          <CurrentLocationDot />
        </AdvancedMarker>
      )}

      <MapMarkers markers={markers} />

      <SearchAreaControl
        onSearchMapArea={onSearchMapArea!}
        visible={searchBtnVisible}
        setVisible={setSearchBtnVisible}
      />

      <ZoomAndLocateControls onLocate={() => fetchLocation(true)} />
    </GoogleMap>
  );
}
