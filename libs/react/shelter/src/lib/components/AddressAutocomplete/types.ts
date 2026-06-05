import { TMapBounds } from '../Map';

export type TPlaceResult = {
  id: string;
  displayName: string | null;
  formattedAddress: string | null;
  location: { lat: number; lng: number } | null;
  /** Recommended map viewport from Places; used to fit zip codes, cities, states, etc. */
  viewport?: TMapBounds;
};
