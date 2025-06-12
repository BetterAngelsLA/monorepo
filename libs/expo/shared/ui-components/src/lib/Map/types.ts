import { ClusterFeature, PointFeature } from 'supercluster';

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

export type TPointPropertiesBase = {
  pointId: number | string;
};

export type TPointProperties<T = NoExtraProps> = TPointPropertiesBase & T;

export type TGeoPoint<T = NoExtraProps> = PointFeature<TPointProperties<T>>;
export type TClusterFeature<T = NoExtraProps> = ClusterFeature<
  TPointProperties<T>
>;
export type TMapFeature<T = NoExtraProps> = TGeoPoint<T> | TClusterFeature<T>;
export type TBbox = [number, number, number, number];
