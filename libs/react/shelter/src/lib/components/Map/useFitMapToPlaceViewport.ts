import { useMap } from '@vis.gl/react-google-maps';
import { useEffect } from 'react';
import { TMapBounds } from './types.maps';
import { fitMapToPlaceViewport } from './utils/fitMapToPlaceViewport';
import { fromMapBounds } from './utils/fromMapBounds';
import { toMapBounds } from './utils/toMapBounds';

type TUseFitMapToPlaceViewportOptions = {
  /** When set, the map zooms/pans so this viewport is fully visible. */
  viewport: TMapBounds | null;
  /**
   * Called after the map finishes settling (idle) following fitBounds.
   * Receives the actual rendered bounds, which may be larger than the Place
   * viewport due to the map element's aspect ratio.
   */
  onFitted?: (actualBounds: TMapBounds) => void;
};

/**
 * Applies a Places viewport to the map via `fitBounds`, per Google's recommended
 * pattern (useMap + geometry.viewport).
 */
export function useFitMapToPlaceViewport(
  options: TUseFitMapToPlaceViewportOptions
): void {
  const { viewport, onFitted } = options;
  const map = useMap();

  useEffect(() => {
    if (!map || !viewport) {
      return;
    }

    fitMapToPlaceViewport(map, fromMapBounds(viewport));

    const listener = map.addListener('idle', () => {
      listener.remove();
      const actual = map.getBounds();
      if (actual && onFitted) {
        onFitted(toMapBounds(actual));
      }
    });

    return () => listener.remove();
  }, [map, viewport, onFitted]);
}
