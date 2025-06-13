import {
  ClusterOrPoint,
  IClusterGeoJson,
  TClusterLeafPoint,
  TClusterPoint,
} from '@monorepo/expo/shared/ui-components';
import { RefObject } from 'react';
import { Marker, TMapView } from '../../../maps';

type TProps<P extends IClusterGeoJson = IClusterGeoJson> = {
  mapRef: RefObject<TMapView | null>;
  clusters: ClusterOrPoint<P>[];
  clusterRenderer: (cluster: TClusterPoint) => React.ReactNode;
  pointRenderer: (point: TClusterLeafPoint<P>) => React.ReactNode;
  onClusterPress?: (cluster: TClusterPoint) => void;
  onPointPress?: (point: TClusterLeafPoint<P>) => void;
};

export function InteractionClusters<P extends IClusterGeoJson>(
  props: TProps<P>
) {
  const {
    clusters,
    clusterRenderer,
    pointRenderer,
    onClusterPress,
    onPointPress,
  } = props;
  const clusterItems = clusters.filter(
    (i) => !!i.properties.cluster
  ) as TClusterPoint[];

  const leafItems = clusters.filter(
    (i) => !i.properties.cluster
  ) as TClusterLeafPoint<P>[];

  return (
    <>
      {clusterItems.map((cluster) => {
        const { cluster_id } = cluster.properties;
        const [longitude, latitude] = cluster.geometry.coordinates;

        return (
          <Marker
            key={`cluster-${cluster_id}`}
            tracksViewChanges={false}
            coordinate={{ latitude, longitude }}
            onPress={() => onClusterPress?.(cluster)}
          >
            {clusterRenderer(cluster)}
          </Marker>
        );
      })}

      {leafItems.map((point) => {
        const { geometry, properties } = point;
        const [longitude, latitude] = geometry.coordinates;
        const { id } = properties;

        return (
          <Marker
            key={`point-${id}`}
            coordinate={{ latitude, longitude }}
            tracksViewChanges={false}
            onPress={() => onPointPress?.(point)}
          >
            {pointRenderer(point)}
          </Marker>
        );
      })}
    </>
  );
}
