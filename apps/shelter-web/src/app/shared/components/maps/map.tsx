import { MapPinIcon } from '@monorepo/react/icons';

import {
  AdvancedMarker,
  Map as GoogleMap,
  useAdvancedMarkerRef,
  useMap,
} from '@vis.gl/react-google-maps';
import { useEffect, useState } from 'react';
import { mergeCss } from '../../utils/styles/mergeCss';
import {
  DEFAULT_MAP_ZOOM,
  LA_COUNTY_CENTER_LAT,
  LA_COUNTY_CENTER_LNG,
} from './constants.maps';
import { MapHandler, getPlacesBounds } from './mapHandler';
import { MapZoomControls } from './mapZoomControls';
import { TLatLng } from './types.maps';

const defaultCenter = {
  lat: LA_COUNTY_CENTER_LAT,
  lng: LA_COUNTY_CENTER_LNG,
};

type TMap = {
  className?: string;
  mapBounds?: google.maps.LatLngBoundsLiteral;
  center?: TLatLng | null;
};

const defaultBounds = getPlacesBounds({
  boundsCenter: defaultCenter,
});

export function Map(props: TMap) {
  const { className = '', mapBounds = defaultBounds, center } = props;

  const map = useMap();
  const [markerRef] = useAdvancedMarkerRef();
  const [mapCenter, setMapCenter] = useState<TLatLng | null | undefined>(null);

  useEffect(() => {
    if (center === undefined) {
      return;
    }

    setMapCenter(center || defaultCenter);
  }, [center]);

  const mapCss = ['h-12', 'w-full', className];

  return (
    <GoogleMap
      mapId={'shelter-map'}
      className={mergeCss(mapCss)}
      defaultCenter={defaultCenter}
      defaultBounds={mapBounds}
      gestureHandling={'greedy'}
      defaultZoom={DEFAULT_MAP_ZOOM}
      disableDefaultUI={true}
    >
      <AdvancedMarker ref={markerRef} position={mapCenter}>
        <MapPinIcon className="h-12" />
      </AdvancedMarker>
      <MapZoomControls map={map} className="mr-4" />
      <MapHandler center={center} />
    </GoogleMap>
  );
}
