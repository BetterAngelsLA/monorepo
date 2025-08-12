import type { GeoJsonProperties } from 'geojson';
import { EdgePadding } from 'react-native-maps';
import type { AnyProps, ClusterFeature, PointFeature } from 'supercluster';

export type TCoordinates = {
  latitude: number;
  longitude: number;
};

type NoExtraProps = Record<never, never>;

// Base properties shared by all points and clusters
// Includes a unique id and a precomputed hash for efficient comparison
export type TPropertiesBase = {
  id: string;
  _identityHash: string;
};

// Extended GeoJSON properties for points
export type TPointProperties<T = NoExtraProps> = TPropertiesBase & T;

// Single clusterable point in GeoJSON format
export type TGeoPoint<T = NoExtraProps> = PointFeature<TPointProperties<T>>;

// Cluster returned by Supercluster
// Contains additional fields like cluster_id and point_count
export type TCluster<T = NoExtraProps> = ClusterFeature<TPointProperties<T>>;

// Bounding box used by Supercluster [west, south, east, north]
export type TBbox = [number, number, number, number];

// Reusable type constraint for all point data
export type IClusterGeoJson = GeoJsonProperties & TPropertiesBase;

// Leaf/individual point inside a cluster
export type TClusterLeafPoint<P extends IClusterGeoJson> = PointFeature<P> & {
  properties: P & { cluster?: false };
};

// Cluster feature returned by Supercluster
// cluster = true and should contain multiple leaves/points
export type TClusterPoint<P extends IClusterGeoJson = IClusterGeoJson> =
  ClusterFeature<AnyProps> & {
    properties: AnyProps & {
      cluster: true;
      cluster_id: number;
      point_count: number;

      // present on clusters that cannot expand further
      maxZoomLeaves?: TClusterLeafPoint<P>[];
    };
  };

export type ClusterOrPoint<P extends IClusterGeoJson> =
  | TClusterLeafPoint<P>
  | TClusterPoint;

// Used with fitToCluster for dynamic edge padding when rendering clusters.
// `max` prop specifies max number of points/clusters padding should apply to.
// Breakpoints get sorted my `max` prop and selected based on number of leaves.
export type TEdgePaddingBreakpoint = {
  max: number;
  padding: EdgePadding;
};
