import { ControlPosition, MapControl, useMap } from '@vis.gl/react-google-maps';
import { useCallback, useRef, useState } from 'react';
import { useOnMapIdle } from '../hooks/useOnMapIdle';
import { TMapState } from '../types.maps';
import { getMapState } from '../utils/getMapState';
import { SearchMapAreaButton } from './searchMapAreaButton';

export function SearchAreaControl({
  onSearchMapArea,
}: {
  onSearchMapArea: (mapState: TMapState) => void;
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

    const state = getMapState(map);

    if (state) {
      onSearchMapArea(state);
    }
  }, [map, onSearchMapArea, getMapState]);

  if (!visible) {
    return null;
  }

  return (
    <MapControl position={ControlPosition.TOP_CENTER}>
      <SearchMapAreaButton onClick={handleClick} />
    </MapControl>
  );
}
