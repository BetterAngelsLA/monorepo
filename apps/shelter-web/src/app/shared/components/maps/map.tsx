import MapPin from '@assets/icons/svg/mapPin.svg?react';
import {
  AdvancedMarker,
  Map as GoogleMap,
  useAdvancedMarkerRef,
  useMap,
} from '@vis.gl/react-google-maps';
import { mergeCss } from '../../utils/styles/mergeCss';
import { LA_COUNTY_CENTER_LAT, LA_COUNTY_CENTER_LNG } from './constants.maps';
import { MapZoomControls } from './mapZoomControls';

type TMap = {
  className?: string;
  mapBounds?: google.maps.LatLngBoundsLiteral;
};

export function Map(props: TMap) {
  const { className = '', mapBounds } = props;

  const map = useMap();
  const [markerRef, marker] = useAdvancedMarkerRef();

  const mapCss = ['h-12', 'w-full', className];

  return (
    <GoogleMap
      mapId={'bf51a910020fa25a'}
      className={mergeCss(mapCss)}
      defaultCenter={{
        lat: LA_COUNTY_CENTER_LAT,
        lng: LA_COUNTY_CENTER_LNG,
      }}
      defaultBounds={mapBounds}
      gestureHandling={'greedy'}
      defaultZoom={11}
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
      <MapZoomControls map={map} className="mr-4" />
    </GoogleMap>
  );
}
