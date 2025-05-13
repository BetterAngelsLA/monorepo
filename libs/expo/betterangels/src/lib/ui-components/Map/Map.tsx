import { MapPinIcon } from '@monorepo/expo/shared/icons';
import { useEffect, useRef, useState } from 'react';
import { StyleSheet } from 'react-native';
import { Region } from 'react-native-maps';
import Supercluster from 'supercluster';
import { MapView, Marker, TMapView } from '../../maps';
import { ClusterMarker } from './ClusterMarker';
import { defaultRegion } from './contants';
import { TLaLocation, laLocations } from './locations';
import { TGeoPoint, TMapFeature, TPointProperties } from './types';
import { calcBbox } from './utils/calcBbox';
import { getGeoPoints } from './utils/getGeoPoints';
import { zoomToCluster } from './utils/zoomToCluster';

const points = getGeoPoints(laLocations);

type TBaMapProps = {
  provider?: 'google';
  onRegionChangeComplete?: (region: Region) => void;
  onSelectedChange?: (
    items: TMapFeature<TLaLocation>[],
    zoomLevel: number
  ) => void;
};

export function BaMap(props: TBaMapProps) {
  const {
    provider: mapPovider,
    onRegionChangeComplete,
    onSelectedChange,
  } = props;

  const mapRef = useRef<TMapView>(null);
  const [region, setRegion] = useState<Region | null>(null);
  const [clusters, setClusters] = useState<TMapFeature[]>([]);

  const superclusterRef = useRef(
    new Supercluster<TPointProperties<TLaLocation>>({
      radius: 40,
      maxZoom: 20,
    })
  );

  // 2. Load points into supercluster
  useEffect(() => {
    superclusterRef.current.load(points);
    setRegion(defaultRegion);
  }, [mapPovider]);

  useEffect(() => {
    if (!region) {
      return;
    }

    const bbox = calcBbox(region);
    const zoom = Math.round(Math.log(360 / region.longitudeDelta) / Math.LN2);

    if (zoom > 17) {
      const rawPoints = points.filter((point) => {
        const [lng, lat] = point.geometry.coordinates;
        return (
          lng >= bbox[0] && lat >= bbox[1] && lng <= bbox[2] && lat <= bbox[3]
        );
      });

      setClusters(rawPoints as TGeoPoint[]);

      return;
    }

    const newClusters = superclusterRef.current.getClusters(
      bbox,
      zoom
    ) as TMapFeature[];

    setClusters(newClusters);
  }, [mapPovider, region]);

  return (
    <MapView
      ref={mapRef}
      provider={mapPovider}
      zoomEnabled
      scrollEnabled
      zoomControlEnabled
      mapType="standard"
      style={styles.map}
      initialRegion={defaultRegion}
      onRegionChangeComplete={(region) => {
        setRegion(region);
        onRegionChangeComplete?.(region);
      }}
    >
      {clusters.map((cluster, idx) => {
        const [longitude, latitude] = cluster.geometry.coordinates;
        const isCluster = !!(cluster.properties as any).cluster;

        if (!isCluster) {
          return (
            <Marker
              key={`marker-${cluster.properties.pointId}`}
              coordinate={{ latitude, longitude }}
              zIndex={99999}
              onPress={() => {
                if (!region) {
                  return;
                }

                const zoomLevel = Math.round(
                  Math.log2(360 / region.longitudeDelta)
                );

                onSelectedChange?.(
                  [cluster as TGeoPoint<TLaLocation>],
                  zoomLevel
                );
              }}
              // />
            >
              <MapPinIcon
                // outlineColor="green"
                // fillColor="green"
                text="44"
                subscriptAfter="+"
                // size="L"
                size="M"
                // size="S"
              />
            </Marker>
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
                // const expansionZoom =
                //   superclusterRef.current.getClusterExpansionZoom(
                //     cluster.id as number
                //   );

                const leaves = superclusterRef.current.getLeaves(
                  cluster.id as number,
                  100
                );

                if (!region) {
                  return;
                }

                const zoomLevel = Math.round(
                  Math.log2(360 / region.longitudeDelta)
                );

                onSelectedChange?.(leaves, zoomLevel);

                zoomToCluster(
                  mapRef,
                  superclusterRef.current,
                  cluster.id as number
                );
              }}
            />
          );
        }

        return null;
      })}
    </MapView>
  );
}

const styles = StyleSheet.create({
  map: {
    width: '100%',
    height: 350,
  },
});
