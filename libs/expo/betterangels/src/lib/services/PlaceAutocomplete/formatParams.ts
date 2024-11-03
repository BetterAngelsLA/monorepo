import { TLatLngRectangle } from './types';

type TAutocompleteInputs = {
  input: string; // query
  region?: string; // used for result formatting, not restrictions
  components?: string; // restrict to country
  locationBias?: google.maps.LatLngBoundsLiteral; // soft boundary when searching for places
  locationRestriction?: google.maps.LatLngBoundsLiteral; // hard boundary when searching for places
};

type TFormattedAutocompleteParams = {
  input: string;
  region: string;
  components: string;
  locationrestriction?: TLatLngRectangle;
  locationbias?: TLatLngRectangle;
};

export function formatAutocompleteParams(params: TAutocompleteInputs) {
  const {
    input,
    locationBias,
    locationRestriction,
    region = 'us',
    components = 'country:us',
  } = params;

  const formattedParams: TFormattedAutocompleteParams = {
    input,
    region,
    components,
  };

  if (locationBias) {
    const { south, west, north, east } = locationBias;

    formattedParams.locationbias = `rectangle:${south},${west}|${north},${east}`;
  }

  if (locationRestriction) {
    const { south, west, north, east } = locationRestriction;

    formattedParams.locationrestriction = `rectangle:${south},${west}|${north},${east}`;
  }

  return formattedParams;
}
