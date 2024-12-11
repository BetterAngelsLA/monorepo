import MapPin from '@assets/icons/svg/mapPin.svg?react';
import {
  AdvancedMarker,
  ControlPosition,
  Map as GoogleMap,
  MapControl,
  useAdvancedMarkerRef,
} from '@vis.gl/react-google-maps';
import { useState } from 'react';
import { twCss } from '../../utils/styles/twCss';
import { LA_COUNTY_CENTER_LAT, LA_COUNTY_CENTER_LNG } from './constants.maps';
import { ZoomButton } from './zoomButton';

type TMap = {
  className?: string;
  mapBounds?: google.maps.LatLngBoundsLiteral;
};

export function Map(props: TMap) {
  const { className = '', mapBounds } = props;

  const [markerRef, marker] = useAdvancedMarkerRef();
  const [zoomLevel, setZoomLevel] = useState(11);

  function onZoomIn() {
    setZoomLevel((prev) => prev + 0.5);
  }

  function onZoomOut() {
    setZoomLevel((prev) => prev - 0.5);
  }

  const mapCss = ['h-12', 'w-full', className];

  return (
    <GoogleMap
      mapId={'bf51a910020fa25a'}
      className={twCss(mapCss)}
      defaultCenter={{
        lat: LA_COUNTY_CENTER_LAT,
        lng: LA_COUNTY_CENTER_LNG,
      }}
      defaultBounds={mapBounds}
      gestureHandling={'greedy'}
      zoom={zoomLevel}
      disableDefaultUI={true}
    >
      <AdvancedMarker
        ref={markerRef}
        position={{
          lat: LA_COUNTY_CENTER_LAT,
          lng: LA_COUNTY_CENTER_LNG,
        }}
      >
        <MapPin />
      </AdvancedMarker>
      <MapControl position={ControlPosition.INLINE_END_BLOCK_END}>
        <div className="mr-4">
          <ZoomButton className="text-neutral-40" onClick={onZoomIn}>
            +
          </ZoomButton>
          <ZoomButton className="mt-1.5" onClick={onZoomOut}>
            <div className="w-4 h-[3px] bg-neutral-40"></div>
          </ZoomButton>
        </div>
      </MapControl>
    </GoogleMap>
  );
}
