import { useState } from 'react';
import { TLatLng } from '../types.maps';
import { peekSavedMapViewport } from './mapViewportStorage';

export type TRestoredMapCamera = {
  /** Center the Map should mount at when a viewport was saved (undefined = default). */
  defaultCenter?: TLatLng;
  /** Zoom the Map should mount at when a viewport was saved (undefined = default). */
  defaultZoom?: number;
};

/**
 * Reads the map viewport saved before navigating to a shelter detail page and
 * exposes it as the Map's default camera, so the Map mounts directly at the
 * exact restored center + zoom. The value is deliberately NOT consumed here —
 * the HomePage init effect consumes it (single use) once the map is ready.
 * Peeking (instead of consuming) keeps this render-phase read safe under
 * React StrictMode, where the state initializer may run twice.
 */
export function useRestoredMapViewport(): TRestoredMapCamera {
  const [restoredViewport] = useState(() => peekSavedMapViewport());

  return {
    defaultCenter: restoredViewport?.center,
    defaultZoom: restoredViewport?.zoom,
  };
}
