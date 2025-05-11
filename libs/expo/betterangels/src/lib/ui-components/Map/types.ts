import { ClusterFeature, PointFeature } from 'supercluster';

export type TCoordinates = {
  latitude: number;
  longitude: number;
};

export type TPointPropertiesBase = {
  pointId: number | string;
};

export type TPointProperties<TExtra = {}> = TPointPropertiesBase & TExtra;

export type TGeoPoint<T = {}> = PointFeature<TPointProperties<T>>;
export type TClusterFeature<T = {}> = ClusterFeature<TPointProperties<T>>;
export type TMapFeature<T = {}> = TGeoPoint<T> | TClusterFeature<T>;
export type TBbox = [number, number, number, number];
