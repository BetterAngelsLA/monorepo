import { TGeoPoint } from '../../ui-components';
import { TLaLocation } from '../../ui-components/Map/locations';
import { SuperClusterMap } from './SuperClusterMap';

type TSelectedState = {
  items?: TGeoPoint<TLaLocation>[];
  zoomLevel?: number;
};

export default function ClusterG() {
  return <SuperClusterMap />;
}
