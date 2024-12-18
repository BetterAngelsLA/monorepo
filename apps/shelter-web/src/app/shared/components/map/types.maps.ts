export type TLatLng = {
  latitude: number;
  longitude: number;
};

export interface TAddress extends TLatLng {
  address: string;
}

export type TMarker = {
  position: TLatLng;
  id?: string;
  label?: string;
  onClick?: (id?: string) => void;
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
