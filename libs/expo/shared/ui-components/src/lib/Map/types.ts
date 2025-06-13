import type { GeoJsonProperties } from 'geojson';
import type { AnyProps, ClusterFeature, PointFeature } from 'supercluster';

export type TMapLocation = {
  name: string;
  latitude: number;
  longitude: number;
};

export type TMapLatLng = {
  lat: number;
  lng: number;
};

export type TMapDeltaLatLng = {
  latitudeDelta: number;
  longitudeDelta: number;
};

export type RegionDeltaSize =
  | 'XS'
  | 'S'
  | 'M'
  | 'L'
  | 'XL'
  | '2XL'
  | '3XL'
  | '4XL';

// Clusters

export type TCoordinates = {
  latitude: number;
  longitude: number;
};

type NoExtraProps = Record<never, never>;

type TPointPropertiesBase = {
  pointId: number | string;
  id: string;
};

export type TPointProperties<T = NoExtraProps> = TPointPropertiesBase & T;

export type TGeoPoint<T = NoExtraProps> = PointFeature<TPointProperties<T>>;

export type TClusterFeature<T = NoExtraProps> = ClusterFeature<
  TPointProperties<T>
>;

export type TMapFeature<T = NoExtraProps> = TGeoPoint<T> | TClusterFeature<T>;
export type TBbox = [number, number, number, number];

// STRONG TYPE CLUSTER

export type IClusterGeoJson = GeoJsonProperties & { id: string };

// requrie unique ID
export type TClusterLeafPoint<P extends IClusterGeoJson> = PointFeature<P> & {
  properties: P & { cluster?: false };
};

export type TClusterPoint = ClusterFeature<AnyProps> & {
  properties: AnyProps & {
    cluster: true;
    cluster_id: number;
    point_count: number;
  };
};

export type ClusterOrPoint<P extends IClusterGeoJson> =
  | TClusterLeafPoint<P>
  | TClusterPoint;

// export interface TClusteredMarkersProps<
//   P extends IClusterGeoJson = IClusterGeoJson
// > {
//   clusters: ClusterOrPoint<P>[];
//   onClusterPress?: (cluster: TClusterPoint) => void;
//   onPointPress?: (point: TClusterLeafPoint<P>) => void;
//   clusterRenderer: (cluster: TClusterPoint) => React.ReactNode;
//   pointRenderer: (point: TClusterLeafPoint<P>) => React.ReactNode;
// }
