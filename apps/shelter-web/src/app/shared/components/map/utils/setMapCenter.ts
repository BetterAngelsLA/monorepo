import { LatLngLiteral } from '../types.maps';

type TProps = {
  center: LatLngLiteral;
  map: google.maps.Map | null;
  onCenterSet?: () => void;
};

export function setMapCenter(props: TProps) {
  const { map, center, onCenterSet } = props;

  if (!map) {
    return;
  }

  const listener = map.addListener('center_changed', () => {
    listener.remove();

    onCenterSet?.();
  });

  map.setCenter(center);
}
