/// <reference types="google.maps" />
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

/** Fully controlled map camera (center + zoom). */
export type TMapCamera = {
  center: TLatLng;
  zoom: number;
};

export interface TAddress extends TLatLng {
  address: string;
}

export type TMarker = {
  position: TLatLng;
  id?: string;
  label?: string;
  onClick?: ((e: google.maps.marker.AdvancedMarkerClickEvent) => void) | undefined;
  type?: 'primary' | 'secondary' | 'purple';
  isPrivate?: boolean;
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
