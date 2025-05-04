import { MapPinIcon } from '@monorepo/react/icons';
import { AdvancedMarker } from '@vis.gl/react-google-maps';
import type { TMarker } from '../types.maps';
import { toGoogleLatLngLiteral } from '../utils/toGoogleLatLngLiteral';

export function MapMarkers({ markers }: { markers: TMarker[] }) {
  return (
    <>
      {markers.map((marker) => (
        <AdvancedMarker
          key={marker.id}
          position={toGoogleLatLngLiteral(marker.position)}
          zIndex={99}
          onClick={marker.onClick}
        >
          <MapPinIcon className="h-10" type="secondary" />
        </AdvancedMarker>
      ))}
    </>
  );
}
