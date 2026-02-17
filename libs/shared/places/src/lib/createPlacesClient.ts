import { getPlaceAutocomplete } from './getPlaceAutocomplete';
import { getPlaceDetailsById } from './getPlaceDetailsById';
import { reverseGeocode, TReverseGeocodeResult } from './reverseGeocode';
import {
  TFetchClient,
  TPlaceLatLng,
  TPlacePrediction,
  TPlaceDetails,
} from './types';

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

export function createPlacesClient(fetchClient: TFetchClient): TPlacesClient {
  return {
    autocomplete: (query, options) =>
      getPlaceAutocomplete({ fetchClient, query, ...options }),
    getDetails: (placeId, options) =>
      getPlaceDetailsById({ fetchClient, placeId, ...options }),
    reverseGeocode: (latitude, longitude) =>
      reverseGeocode({ fetchClient, latitude, longitude }),
  };
}
