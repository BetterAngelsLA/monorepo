import { SESSION_STORAGE_MAP_VIEWPORT } from '../../../constants';
import { TLatLng } from '../types.maps';

/** Exact map viewport: center coordinates + zoom level. */
export type TMapViewport = {
  center: TLatLng;
  zoom: number;
};

/** Minimal surface of the Google Map we read a viewport from. */
type TMapLike = {
  getCenter: () => { lat: () => number; lng: () => number } | null;
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

/**
 * Persists the exact map center + zoom before navigating to a shelter detail
 * page so the identical viewport (and therefore search results) can be
 * restored on return. Restoring via fitBounds is avoided because it can pick a
 * different zoom level (with padding), which changes the visible pins.
 */
export function saveMapViewport(viewport: TMapViewport): void {
  try {
    sessionStorage.setItem(
      SESSION_STORAGE_MAP_VIEWPORT,
      JSON.stringify(viewport)
    );
  } catch {
    // sessionStorage can be unavailable (private mode, quota exceeded).
    // Navigation proceeds without viewport restore in that case.
  }
}

/**
 * Reads (without consuming) the saved map viewport. Used to initialize the
 * Map's default camera so it mounts directly at the exact restored center +
 * zoom, avoiding the controlled map overriding imperative camera calls.
 */
export function peekSavedMapViewport(): TMapViewport | null {
  const raw = sessionStorage.getItem(SESSION_STORAGE_MAP_VIEWPORT);
  if (!raw) {
    return null;
  }
  try {
    return JSON.parse(raw) as TMapViewport;
  } catch {
    return null;
  }
}

/**
 * Reads and consumes the previously saved map viewport so it's applied only
 * once, immediately after returning from a shelter detail page. Returns null
 * when nothing is saved or the stored value is malformed.
 */
export function consumeSavedMapViewport(): TMapViewport | null {
  const raw = sessionStorage.getItem(SESSION_STORAGE_MAP_VIEWPORT);
  if (!raw) {
    return null;
  }
  // Consume the saved viewport so it isn't re-applied on navigations that
  // don't originate from a shelter detail page.
  sessionStorage.removeItem(SESSION_STORAGE_MAP_VIEWPORT);
  try {
    return JSON.parse(raw) as TMapViewport;
  } catch {
    return null;
  }
}
