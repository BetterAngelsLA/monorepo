import { MapPinIcon } from '@monorepo/expo/shared/icons';
import { Colors } from '@monorepo/expo/shared/static';
import { useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet } from 'react-native';
import { Region } from 'react-native-maps';
import Supercluster from 'supercluster';
import { MapView, Marker, TMapView } from '../../maps';
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

  const mapRef = useRef<TMapView | null>(null);
  const [mapReady, setMapReady] = useState(false);
  const [region, setRegion] = useState<Region | null>(null);
  const [clusters, setClusters] = useState<TMapFeature[]>([]);

  const superclusterRef = useRef(
    new Supercluster<TPointProperties<TLaLocation>>({
      radius: 30,
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

  console.log('');
  console.log('------');
  return (
    <MapView
      ref={mapRef}
      provider={mapPovider}
      zoomEnabled
      scrollEnabled
      zoomControlEnabled
      mapType="standard"
      initialRegion={defaultRegion}
      onMapReady={() => {
        setTimeout(() => {
          setMapReady(true);
        }, 100);
      }}
      onRegionChangeComplete={(region) => {
        setRegion(region);
        onRegionChangeComplete?.(region);
      }}
      style={styles.map}
    >
      {!!mapReady &&
        clusters.map((cluster, idx) => {
          const isCluster = !!(cluster.properties as any).cluster;

          // if (!isCluster) {
          //   console.log(
          //     '*****************  cluster.properties.pointId:',
          //     cluster.properties.pointId
          //   );
          //   return (
          //     <PointMarker
          //       key={`point-${cluster.properties.pointId}-${idx}`}
          //       cluster={cluster}
          //       onSelectedChange={onSelectedChange}
          //       region={region}
          //     />
          //   );
          // }

          if (isCluster) {
            console.log('*****************  cluster.id:', cluster.id);
            return (
              <ClusterMarker
                key={`cluster-${cluster.id}`}
                cluster={cluster}
                region={region}
                mapRef={mapRef}
                superclusterRef={superclusterRef}
                onSelectedChange={onSelectedChange}
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

type TPointMarker = {
  cluster: TMapFeature;
  region?: Region | null;
  onSelectedChange?: (
    items: TMapFeature<TLaLocation>[],
    zoomLevel: number
  ) => void;
};

function PointMarker(props: TPointMarker) {
  const { cluster, region, onSelectedChange } = props;

  const [longitude, latitude] = cluster.geometry.coordinates;
  const coordinate = useMemo(
    () => ({ latitude, longitude }),
    [latitude, longitude]
  );

  console.log('*****************  coordinate:', coordinate);

  return (
    <Marker
      // coordinate={coordinate}
      coordinate={{ longitude, latitude }}
      zIndex={20000}
      // tracksViewChanges={false}
      onPress={() => {
        if (!region) {
          return;
        }

        const zoomLevel = Math.round(Math.log2(360 / region.longitudeDelta));

        onSelectedChange?.([cluster as TGeoPoint<TLaLocation>], zoomLevel);
      }}
    >
      {/* <MapPinSvg outlineColor="green" size="M" /> */}
      {/* <MapPinIcon
        // fillColor={Colors.ERROR}
        // textColor={Colors.WHITE}
        // subscriptAfter="+"
        size="M"
      /> */}
    </Marker>
  );
}

type TClusterMarker = {
  cluster: TMapFeature;
  region?: Region | null;
  mapRef: any;
  superclusterRef: any;
  onSelectedChange?: (
    items: TMapFeature<TLaLocation>[],
    zoomLevel: number
  ) => void;
};

function ClusterMarker(props: TClusterMarker) {
  const { cluster, mapRef, superclusterRef, region, onSelectedChange } = props;

  const [longitude, latitude] = cluster.geometry.coordinates;
  const coordinate = useMemo(
    () => ({ latitude, longitude }),
    [latitude, longitude]
  );

  const count = (cluster.properties as any).point_count as number;

  return (
    <Marker
      tracksViewChanges={false}
      coordinate={coordinate}
      // zIndex={1000}
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

        const zoomLevel = Math.round(Math.log2(360 / region.longitudeDelta));

        onSelectedChange?.(leaves, zoomLevel);

        zoomToCluster(mapRef, superclusterRef.current, cluster.id as number);
      }}
    >
      <MapPinIcon
        fillColor={Colors.ERROR}
        textColor={Colors.WHITE}
        text={String(count)}
        // subscriptAfter="+"
        size="M"
      />
    </Marker>
  );
}
