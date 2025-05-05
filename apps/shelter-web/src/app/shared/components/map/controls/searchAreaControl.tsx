import { ControlPosition, MapControl, useMap } from '@vis.gl/react-google-maps';
import { Dispatch, SetStateAction, useCallback } from 'react';
import { SearchMapAreaButton } from './searchMapAreaButton';

type TProps = {
  visible?: boolean;
  setVisible: Dispatch<SetStateAction<boolean>>;
  onSearchMapArea: (bounds?: google.maps.LatLngBounds) => void;
};

export function SearchAreaControl(props: TProps) {
  const { visible, setVisible, onSearchMapArea } = props;

  const map = useMap();

  // const [visible, setVisible] = useState(false);
  // const skippedFirstIdleRef = useRef(false);

  // useOnMapIdle(() => {
  //   if (!skippedFirstIdleRef.current) {
  //     skippedFirstIdleRef.current = true;

  //     return;
  //   }

  //   setVisible(true);
  // });

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
