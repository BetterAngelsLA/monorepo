import { Region } from 'react-native-maps';
import { defaultRegionDelta } from '../constants';

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
    latitudeDelta = defaultRegionDelta.latitudeDelta,
    longitudeDelta = defaultRegionDelta.longitudeDelta,
  } = props;

  return {
    latitude,
    longitude,
    latitudeDelta,
    longitudeDelta,
  };
}
