import { TPlaceViewport } from './types';

/** Normalizes a Places API viewport to west/south/east/north edges. */
export function placeViewportToEdges(viewport: TPlaceViewport): {
  westLng: number;
  southLat: number;
  eastLng: number;
  northLat: number;
} {
  return {
    southLat: Math.min(viewport.low.latitude, viewport.high.latitude),
    northLat: Math.max(viewport.low.latitude, viewport.high.latitude),
    westLng: Math.min(viewport.low.longitude, viewport.high.longitude),
    eastLng: Math.max(viewport.low.longitude, viewport.high.longitude),
  };
}
