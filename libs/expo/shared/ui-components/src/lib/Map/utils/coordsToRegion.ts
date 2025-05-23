import { Region } from 'react-native-maps';
import { defaultLatDelta, defaultLngDelta } from '../constants';

type TProps = {
  latitude: number;
  longitude: number;
  latitudeDelta?: number;
  longitudeDelta?: number;
};

export function coordsToRegion(props: TProps): Region {
  const {
    latitude,
    longitude,
    latitudeDelta = defaultLatDelta,
    longitudeDelta = defaultLngDelta,
  } = props;

  return {
    latitude,
    longitude,
    latitudeDelta,
    longitudeDelta,
  };
}
