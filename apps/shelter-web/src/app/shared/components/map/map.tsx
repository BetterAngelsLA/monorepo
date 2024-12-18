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
import { useAtom } from 'jotai';
import { useCallback, useEffect, useState } from 'react';
import { modalAtom } from '../../atoms/modalAtom';
import { sheltersAtom } from '../../atoms/sheltersAtom';
import { ModalAnimationEnum } from '../../modal/modal';
import { mergeCss } from '../../utils/styles/mergeCss';
import { ShelterCard } from '../shelter/shelterCard';
import {
  DEFAULT_GESTURE_HANDLING,
  DEFAULT_MAP_ZOOM,
  LA_COUNTY_CENTER,
} from './constants.maps';
import { CurrentLocationBtn } from './controls/currentLocationBtn';
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
  onCenterSelect?: (center: TLatLng) => void;
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
    onCenterSelect,
    markers = [],
  } = props;

  const map = useMap();
  const mapApiStatus = useApiLoadingStatus();

  const [cameraProps, setCameraProps] = useState<MapCameraProps>({
    center: toGoogleLatLng(defaultCenter) as google.maps.LatLngLiteral,
    zoom: defaultZoom,
  });
  const [sheltersData, _setSheltersData] = useAtom(sheltersAtom);
  const [_modal, setModal] = useAtom(modalAtom);

  useEffect(() => {
    console.info(`[map] loading status: ${mapApiStatus}`);
  }, [mapApiStatus]);

  const handleCameraChange = useCallback(
    (event: MapCameraChangedEvent) => {
      setCameraProps(event.detail);
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
      {...cameraProps}
    >
      <AdvancedMarker
        position={cameraProps.center}
        draggable={false}
        zIndex={101}
      >
        <MapPinIcon className="h-10" type="primary" />
      </AdvancedMarker>

      {markers.map((marker) => (
        <AdvancedMarker
          key={marker.id}
          position={toGoogleLatLng(marker.position)}
          zIndex={99}
          onClick={() =>
            setModal({
              content: (
                <ShelterCard
                  className="mt-4"
                  shelter={sheltersData.find(
                    (shelter) => shelter.id === marker.id
                  )}
                />
              ),
              animation: ModalAnimationEnum.EXPAND,
              closeOnMaskClick: true,
            })
          }
        >
          <MapPinIcon className="h-10" type="secondary" />
        </AdvancedMarker>
      ))}

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
