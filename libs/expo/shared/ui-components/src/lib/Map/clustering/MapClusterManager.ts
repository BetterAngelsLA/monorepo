import { TMapView } from '@monorepo/maps';
import { GeoJsonProperties } from 'geojson';
import { RefObject } from 'react';
import Supercluster, {
  AnyProps,
  ClusterFeature,
  PointFeature,
} from 'supercluster';

export interface IMapClusterManager {
  // px around each point to merge into a cluster
  radius?: number;
  // Maximum zoom level at which clusters are generated.
  maxZoom?: number;
  // Tile extent. Radius is calculated relative to this value.
  extent?: number;
  // Size of the KD-tree leaf node. Affects performance.
  nodeSize?: number;
}

export class MapClusterManager<P extends GeoJsonProperties & { id: string }> {
  private readonly clusterIndex: Supercluster<P, AnyProps>;

  constructor(opts: IMapClusterManager = {}) {
    console.log('');
    console.log('################################### NEW CLUSTER MANAGER');
    console.log('');
    const { radius = 50, maxZoom = 20, extent = 512, nodeSize = 64 } = opts;

    this.clusterIndex = new Supercluster<P, AnyProps>({
      radius,
      maxZoom,
      extent,
      nodeSize,
    });
  }

  load(points: PointFeature<P>[]) {
    this.clusterIndex.load(points);
  }

  getClusters(
    bbox: [number, number, number, number],
    zoom: number
  ): Array<PointFeature<P> | ClusterFeature<AnyProps>> {
    return this.clusterIndex.getClusters(bbox, zoom);
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

  zoomToCluster(
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

    mapRef.current.animateToRegion(region, options?.animateDuration ?? 200);
  }
}
