import { ControlPosition, MapControl, useMap } from '@vis.gl/react-google-maps';
import { useCallback, useRef, useState } from 'react';
import { useOnMapIdle } from '../hooks/useOnMapIdle';
import { SearchMapAreaButton } from './searchMapAreaButton';

export function SearchAreaControl({
  onSearchMapArea,
}: {
  onSearchMapArea: (bounds?: google.maps.LatLngBounds) => void;
}) {
  const map = useMap();

  const [visible, setVisible] = useState(false);
  const skippedFirstIdleRef = useRef(false);

  useOnMapIdle(() => {
    if (!skippedFirstIdleRef.current) {
      skippedFirstIdleRef.current = true;

      return;
    }

    setVisible(true);
  });

  const handleClick = useCallback(() => {
    if (!map) {
      return;
    }

    setVisible(false);

    onSearchMapArea(map.getBounds());
  }, [map, onSearchMapArea]);

  if (!visible) {
    return null;
  }

  return (
    <MapControl position={ControlPosition.TOP_CENTER}>
      <SearchMapAreaButton onClick={handleClick} />
    </MapControl>
  );
}
