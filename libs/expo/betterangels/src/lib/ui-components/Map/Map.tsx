import { useEffect, useRef, useState } from 'react';
import { StyleSheet } from 'react-native';
import { Region } from 'react-native-maps';
import Supercluster from 'supercluster';
import { MapView, Marker, PROVIDER_GOOGLE } from '../../maps';
import { ClusterMarker } from './ClusterMarker';
import { defaultRegion } from './contants';
import { laLocations } from './locations';
import { TGeoPoint, TMapFeature } from './types';
import { calcBbox } from './utils/calcBbox';
import { getGeoPoints } from './utils/getGeoPoints';

const points = getGeoPoints(laLocations);

type TBaMapProps = {
  onSelectedChange?: (items: TGeoPoint[]) => void;
};

export function BaMap(props: TBaMapProps) {
  const { onSelectedChange } = props;

  // const mapRef = useRef<TMapView>(null);
  const [region, setRegion] = useState<Region | null>(null);
  const [clusters, setClusters] = useState<TMapFeature[]>([]);

  const superclusterRef = useRef(
    new Supercluster({
      radius: 40,
      maxZoom: 20,
    })
  );

  // 2. Load points into supercluster
  useEffect(() => {
    superclusterRef.current.load(points);
  }, []);

  useEffect(() => {
    if (!region) {
      return;
    }

    const bbox = calcBbox(region);
    const zoom = Math.round(Math.log(360 / region.longitudeDelta) / Math.LN2);

    const newClusters = superclusterRef.current.getClusters(
      bbox,
      zoom
    ) as TMapFeature[];

    setClusters(newClusters);
  }, [region]);

  return (
    <MapView
      provider={PROVIDER_GOOGLE}
      zoomEnabled
      scrollEnabled
      zoomControlEnabled
      mapType="standard"
      style={styles.map}
      initialRegion={defaultRegion}
      onRegionChangeComplete={setRegion}
    >
      {clusters.map((cluster, idx) => {
        const [longitude, latitude] = cluster.geometry.coordinates;
        const isCluster = !!(cluster.properties as any).cluster;

        if (!isCluster) {
          return (
            <Marker
              key={`marker-${cluster.id}-${idx}`}
              coordinate={{ latitude, longitude }}
              title={'location'}
              onPress={() => {
                const expansionZoom =
                  superclusterRef.current.getClusterExpansionZoom(
                    cluster.id as number
                  );

                console.log();
                console.log('| ------------- NOT cluster  ------------- |');
                console.log(cluster);
                console.log();
                // Implement zoom behavior here if desired
              }}
            />
          );
        }

        if (isCluster) {
          const count = (cluster.properties as any).point_count as number;

          return (
            <ClusterMarker
              key={`cluster-${cluster.id}-${idx}`}
              coordinate={{ latitude, longitude }}
              count={count}
              onPress={() => {
                const expansionZoom =
                  superclusterRef.current.getClusterExpansionZoom(
                    cluster.id as number
                  );

                const leaves = superclusterRef.current.getLeaves(
                  cluster.id as number
                ) as TGeoPoint[];

                onSelectedChange?.(leaves);

                console.log();
                console.log(
                  '| -------------  cluster.properties  ------------- |'
                );
                console.log(cluster.properties);
                console.log();

                console.log();
                console.log('| -------------  cluster  ------------- |');
                console.log(cluster);
                console.log();

                // Optional: animate to that zoom level
              }}
            />
          );
        }

        return null;

        // return (
        //   <Marker
        //     key={`point-${cluster.properties.pointId}`}
        //     coordinate={{ latitude, longitude }}
        //     title={cluster.properties.name}
        //   />
        // );
      })}
    </MapView>
  );
}

const styles = StyleSheet.create({
  map: {
    width: '100%',
    height: 450,
  },
});
