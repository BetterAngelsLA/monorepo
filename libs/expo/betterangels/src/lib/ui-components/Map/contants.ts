import { Region } from 'react-native-maps';
import { LA_COUNTY_CENTER } from '../../services';

export const defaultRegion: Region = {
  longitudeDelta: 0.1,
  latitudeDelta: 0.1,
  latitude: LA_COUNTY_CENTER.lat,
  longitude: LA_COUNTY_CENTER.lng,
};
