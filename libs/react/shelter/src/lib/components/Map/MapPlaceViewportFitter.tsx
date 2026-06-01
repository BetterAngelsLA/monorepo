import { useMap } from '@vis.gl/react-google-maps';
import { useEffect } from 'react';
import { TMapBounds } from './types.maps';
import { fitMapToPlaceViewport } from './utils/fitMapToPlaceViewport';
import { fromMapBounds } from './utils/fromMapBounds';

type TProps = {
  /** When set, the map zooms/pans so this viewport is fully visible. */
  viewport: TMapBounds | null;
  onFitted?: () => void;
};

/**
 * Applies a Places viewport to the map via `fitBounds`, per Google’s recommended
 * pattern (useMap + geometry.viewport).
 */
export function MapPlaceViewportFitter(props: TProps) {
  const { viewport, onFitted } = props;
  const map = useMap();

  useEffect(() => {
    if (!map || !viewport) {
      return;
    }

    fitMapToPlaceViewport(map, fromMapBounds(viewport));
    onFitted?.();
  }, [map, viewport, onFitted]);

  return null;
}
