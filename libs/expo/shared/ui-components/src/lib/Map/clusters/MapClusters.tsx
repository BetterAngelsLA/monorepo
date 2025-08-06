import { ReactNode, RefObject } from 'react';
import { Marker } from 'react-native-maps';
import { CustomMarker } from '../mapUi/CustomMarker';
import { TMapView } from '../types';
import {
  ClusterOrPoint,
  IClusterGeoJson,
  TClusterLeafPoint,
  TClusterPoint,
} from './types';

type TProps<P extends IClusterGeoJson = IClusterGeoJson> = {
  mapRef: RefObject<TMapView | null>;
  clusters: ClusterOrPoint<P>[];
  clusterRenderer: (cluster: TClusterPoint) => ReactNode;
  pointRenderer: (point: TClusterLeafPoint<P>) => ReactNode;
  onClusterPress?: (cluster: TClusterPoint) => void;
  onPointPress?: (point: TClusterLeafPoint<P>) => void;
};

export function MapClusters<P extends IClusterGeoJson>(props: TProps<P>) {
  const {
    clusters,
    clusterRenderer,
    pointRenderer,
    onClusterPress,
    onPointPress,
  } = props;
  return (
    <>
      {clusters.map((item) => {
        if (item.properties.cluster) {
          const clusterItem = item as TClusterPoint;

          const { cluster_id } = clusterItem.properties;
          const [longitude, latitude] = clusterItem.geometry.coordinates;

          return (
            <Marker
              key={`cluster-${cluster_id}`}
              tracksViewChanges={false}
              coordinate={{ latitude, longitude }}
              onPress={() => onClusterPress?.(clusterItem)}
            >
              {clusterRenderer(clusterItem)}
            </Marker>
          );
        } else {
          const point = item as TClusterLeafPoint<P>;

          const { geometry, properties } = point;
          const [longitude, latitude] = geometry.coordinates;
          const { id } = properties;

          return (
            <CustomMarker
              label={properties.lastSeen && 'Last Seen'}
              renderIcon={() => pointRenderer(point)}
              key={`point-${id}`}
              coordinate={{ latitude, longitude }}
              tracksViewChanges={false}
              onPress={() => onPointPress?.(point)}
            />
          );
        }
      })}
    </>
  );
}
