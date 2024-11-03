import { TLatLngRectangle } from './types';

type TAutocompleteInputs = {
  input: string;
  language: 'en-US';
  region: 'us';
  locationRestriction?: google.maps.LatLngBoundsLiteral;
  locationBias?: google.maps.LatLngBoundsLiteral;
};

type TFormattedAutocompleteParams = {
  input: string;
  language: 'en-US';
  region: 'us';
  locationrestriction?: TLatLngRectangle;
  locationbias?: TLatLngRectangle;
};

export function formatAutocompleteParams(params: TAutocompleteInputs) {
  const { locationRestriction, locationBias } = params;

  const formattedParams: TFormattedAutocompleteParams = {
    input: params.input,
    language: params.language,
    region: params.region,
  };

  if (locationRestriction) {
    const { south, west, north, east } = locationRestriction;

    formattedParams.locationrestriction = `rectangle:${south},${west}|${north},${east}`;
  }

  if (locationBias) {
    const { south, west, north, east } = locationBias;

    formattedParams.locationbias = `rectangle:${south},${west}|${north},${east}`;
  }

  return formattedParams;
}
