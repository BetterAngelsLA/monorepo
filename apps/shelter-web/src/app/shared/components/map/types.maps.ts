export type TLatLng = {
  latitude: number;
  longitude: number;
};

export type TMapBounds = {
  westLng: number;
  northLat: number;
  eastLng: number;
  southLat: number;
};

export interface TAddress extends TLatLng {
  address: string;
}

export type TMarker = {
  position: TLatLng;
  id?: string;
  label?: string;
  onClick?: ((e: google.maps.MapMouseEvent) => void) | undefined;
};

export type TMapGestureHandling = 'cooperative' | 'greedy' | 'none' | 'auto';

export type TMapZoom =
  | 0
  | 1
  | 2
  | 3
  | 4
  | 5
  | 6
  | 7
  | 8
  | 9
  | 10
  | 11
  | 12
  | 13
  | 14
  | 15
  | 16
  | 17
  | 18
  | 19
  | 20
  | 21
  | 22;
