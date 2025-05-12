import { ClusterFeature, PointFeature } from 'supercluster';

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
