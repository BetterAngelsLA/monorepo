import type { GeoJsonProperties } from 'geojson';
import { EdgePadding } from 'react-native-maps';
import type { AnyProps, ClusterFeature, PointFeature } from 'supercluster';

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

export type IClusterGeoJson = GeoJsonProperties & { id: string };

// require unique ID
export type TClusterLeafPoint<P extends IClusterGeoJson> = PointFeature<P> & {
  properties: P & { cluster?: false };
};

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

export type TEdgePaddingBreakpoint = {
  max: number;
  padding: EdgePadding;
};
