import { TLatLng } from '../types.maps';

/** Exact map viewport: center coordinates + zoom level. */
export type TMapViewport = {
  center: TLatLng;
  zoom: number;
};

/** Minimal surface of the Google Map we read a viewport from. */
type TMapLike = {
  getCenter: () => { lat: () => number; lng: () => number } | null | undefined;
  getZoom: () => number | undefined;
};

/**
 * Reads the exact center + zoom from a map instance. Returns null when the map
 * isn't ready (no center) or the zoom isn't available yet.
 */
export function mapViewportFromMap(map: TMapLike): TMapViewport | null {
  const center = map.getCenter();
  const zoom = map.getZoom();

  if (!center || typeof zoom !== 'number') {
    return null;
  }

  return {
    center: { latitude: center.lat(), longitude: center.lng() },
    zoom,
  };
}
