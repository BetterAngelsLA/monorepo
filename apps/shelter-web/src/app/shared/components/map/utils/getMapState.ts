import { TMapState, TMapZoom } from '../types.maps';
import { toBoundsLiteral } from './toMapBounds';

export function getMapState(map: google.maps.Map | null): TMapState | null {
  if (!map) {
    return null;
  }

  const zoomLevel = map.getZoom();
  const center = map.getCenter();
  const bounds = map.getBounds();

  if (!zoomLevel || !center || !bounds) {
    return null;
  }

  return {
    zoomLevel: zoomLevel as TMapZoom,
    center: center.toJSON(),
    bounds: toBoundsLiteral(bounds),
  };
}
