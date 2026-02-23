import { getPlaceAutocomplete } from './getPlaceAutocomplete';
import { getPlaceDetailsById } from './getPlaceDetailsById';
import { createGoogleFetch } from './googleFetch';
import { reverseGeocode, TReverseGeocodeResult } from './reverseGeocode';
import { TPlaceDetails, TPlaceLatLng, TPlacePrediction } from './types';

type TAutocompleteOptions = {
  boundsCenter?: TPlaceLatLng;
  boundsRadiusMiles?: number;
  includedRegionCodes?: string[];
};

type TGetDetailsOptions = {
  fields?: string;
};

export type TPlacesClient = {
  autocomplete: (
    query: string,
    options?: TAutocompleteOptions
  ) => Promise<TPlacePrediction[]>;
  getDetails: (
    placeId: string,
    options?: TGetDetailsOptions
  ) => Promise<TPlaceDetails>;
  reverseGeocode: (
    latitude: number,
    longitude: number
  ) => Promise<TReverseGeocodeResult>;
};

/**
 * Creates a places client that calls Google APIs directly.
 * The API key is baked into an internal fetch wrapper so
 * individual methods never need to handle it.
 */
export function createPlacesClient(apiKey: string): TPlacesClient {
  const googleFetch = createGoogleFetch(apiKey);

  return {
    autocomplete: (query, options) =>
      getPlaceAutocomplete({ googleFetch, query, ...options }),
    getDetails: (placeId, options) =>
      getPlaceDetailsById({ googleFetch, placeId, ...options }),
    reverseGeocode: (latitude, longitude) =>
      reverseGeocode({ googleFetch, latitude, longitude }),
  };
}
