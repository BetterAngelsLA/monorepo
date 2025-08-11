import { RefObject } from 'react';
import { EdgePadding } from 'react-native-maps';
import Supercluster, {
  AnyProps,
  ClusterFeature,
  PointFeature,
} from 'supercluster';
import { defaultAnimationDuration, defaultEdgePadding } from '../constants';
import { TMapView } from '../types';
import {
  ClusterOrPoint,
  IClusterGeoJson,
  TClusterPoint,
  TEdgePaddingBreakpoint,
} from './types';
import { generateClusterHash } from './utils/generateClusterHash';

export interface IMapClusterManager {
  // px around each point to merge into a cluster
  radius?: number;
  // Maximum zoom level at which clusters are generated.
  maxZoom?: number;
  // Tile extent. Radius is calculated relative to this value.
  extent?: number;
  // Size of the KD-tree leaf node. Affects performance.
  nodeSize?: number;
  // padding to use with map.fitToCoordinates()
  edgePadding?: EdgePadding | TEdgePaddingBreakpoint[];
}

export class MapClusterManager<P extends IClusterGeoJson> {
  private readonly clusterIndex: Supercluster<P, AnyProps>;
  public readonly maxZoom: number;
  public edgePadding?: EdgePadding | TEdgePaddingBreakpoint[];

  constructor(opts: IMapClusterManager = {}) {
    const {
      radius = 50,
      maxZoom = 20,
      extent = 256,
      nodeSize = 40,
      edgePadding,
    } = opts;

    this.maxZoom = maxZoom;
    this.edgePadding = edgePadding;

    this.clusterIndex = new Supercluster<P, AnyProps>({
      radius,
      maxZoom,
      extent,
      nodeSize,
      map: (feature) => ({
        mostRecent: feature.mostRecent,
      }),
      reduce: (acc, props) => {
        acc.mostRecent = acc.mostRecent || props.mostRecent;
      },
    });
  }

  load(points: PointFeature<P>[]) {
    this.clusterIndex.load(points);
  }

  clear() {
    this.clusterIndex.load([]);
  }

  getClusters(
    bbox: [number, number, number, number],
    zoom: number
  ): Array<ClusterOrPoint<P>> {
    const raw = this.clusterIndex.getClusters(bbox, zoom);

    return raw.map((feat) => {
      // if not a cluster, return feat
      if (!feat.properties.cluster) {
        return feat;
      }

      // is a cluster
      const cluster = feat as TClusterPoint<P>;

      const expansion = this.clusterIndex.getClusterExpansionZoom(
        cluster.properties.cluster_id
      );

      const clusterCanZoomMore = expansion < this.maxZoom;

      const baseCluster: TClusterPoint<P> = {
        ...cluster,
        properties: {
          ...cluster.properties,
          _identityHash: generateClusterHash(cluster),
          mostRecent: cluster.properties.mostRecent,
        },
      };

      if (clusterCanZoomMore) {
        return baseCluster;
      }

      // expands past max zoom, so will not be broken up
      // augment cluster with leaves it contains
      const leaves = this.getLeaves(cluster.properties.cluster_id);

      return {
        ...baseCluster,
        properties: {
          ...baseCluster.properties,
          maxZoomLeaves: leaves,
        },
      };
    });
  }

  getLeaves(clusterId: number, limit = 100, offset = 0): PointFeature<P>[] {
    return this.clusterIndex.getLeaves(
      clusterId,
      limit,
      offset
    ) as PointFeature<P>[];
  }

  getClusterExpansionZoom(clusterId: number): number {
    return this.clusterIndex.getClusterExpansionZoom(clusterId);
  }

  getClusterChildren(
    clusterId: number
  ): Array<PointFeature<P> | ClusterFeature<AnyProps>> {
    return this.clusterIndex.getChildren(clusterId);
  }

  getClusterBoundingBox(
    clusterId: number,
    options?: {
      paddingMultiplier?: number;
      animateDuration?: number;
      fallbackDelta?: number;
    }
  ) {
    const { paddingMultiplier = 2, fallbackDelta = 0.02 } = options || {};
    const leaves = this.getLeaves(clusterId);

    let [minLng, minLat] = [Infinity, Infinity];
    let [maxLng, maxLat] = [-Infinity, -Infinity];

    for (const leaf of leaves) {
      const [lng, lat] = leaf.geometry.coordinates;

      minLng = Math.min(minLng, lng);
      maxLng = Math.max(maxLng, lng);
      minLat = Math.min(minLat, lat);
      maxLat = Math.max(maxLat, lat);
    }

    return {
      latitude: (minLat + maxLat) / 2,
      longitude: (minLng + maxLng) / 2,
      latitudeDelta: (maxLat - minLat) * paddingMultiplier || fallbackDelta,
      longitudeDelta: (maxLng - minLng) * paddingMultiplier || fallbackDelta,
    };
  }

  animateToCluster(
    clusterId: number,
    mapRef: RefObject<TMapView | null>,
    options?: {
      paddingMultiplier?: number;
      fallbackDelta?: number;
      animateDuration?: number;
    }
  ) {
    if (!mapRef.current) {
      return;
    }

    const region = this.getClusterBoundingBox(clusterId, {
      paddingMultiplier: options?.paddingMultiplier,
      fallbackDelta: options?.fallbackDelta,
    });

    mapRef.current.animateToRegion(
      region,
      options?.animateDuration ?? defaultAnimationDuration
    );
  }

  resolveEdgePadding(leavesCount: number): EdgePadding | undefined {
    const edgePadding = this.edgePadding;

    if (!Array.isArray(edgePadding)) {
      return edgePadding;
    }

    // is Array
    if (!edgePadding.length) {
      return undefined;
    }

    const sorted = [...edgePadding].sort((a, b) => a.max - b.max);
    const maxPadding = sorted[sorted.length - 1].padding;

    return sorted.find((b) => leavesCount <= b.max)?.padding ?? maxPadding;
  }

  // alternative to animateToCluster (animateToRegion)
  // animates to fit selected cluster leaves on map
  fitToCluster(clusterId: number, mapRef: RefObject<TMapView | null>) {
    const map = mapRef.current;

    if (!map) {
      return;
    }

    const leaves = this.getLeaves(clusterId);

    const coordinates = leaves.map(({ geometry }) => ({
      latitude: geometry.coordinates[1],
      longitude: geometry.coordinates[0],
    }));

    const padding = this.resolveEdgePadding(leaves.length);

    map.fitToCoordinates(coordinates, {
      edgePadding: padding || defaultEdgePadding,
      animated: true,
    });
  }
}
