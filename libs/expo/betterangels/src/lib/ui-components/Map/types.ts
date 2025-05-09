import { ClusterFeature, PointFeature } from 'supercluster';

export type TPointProperties = {
  pointId: number;
  name: string;
};

export type TGeoFeature = PointFeature<TPointProperties>;
export type TClusterFeature = ClusterFeature<TPointProperties>;
export type TMapFeature = TGeoFeature | TClusterFeature;
export type TBbox = [number, number, number, number];
