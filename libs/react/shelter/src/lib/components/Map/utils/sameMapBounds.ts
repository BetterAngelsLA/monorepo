import { TMapBounds } from '../types.maps';

/**
 * Exact-equality comparison of two bounds. Safe here because the map camera is
 * restored to the exact saved center + zoom, so `getBounds()` recomputes
 * identical floating-point values for the same viewport. Any real viewport
 * change (e.g. a window resize) produces different bounds and falls through
 * to a fresh search.
 */
export function sameMapBounds(
  a: TMapBounds | undefined,
  b: TMapBounds | undefined
): boolean {
  return (
    !!a &&
    !!b &&
    a.westLng === b.westLng &&
    a.northLat === b.northLat &&
    a.eastLng === b.eastLng &&
    a.southLat === b.southLat
  );
}
