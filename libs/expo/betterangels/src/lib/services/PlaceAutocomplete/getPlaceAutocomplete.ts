import axios from 'axios';

import { LA_COUNTY_CENTER } from './constants.google.maps';
import { formatAutocompleteParams } from './formatParams';
import { TPlaceLatLng, TPlacesPrediction } from './types';

type TGetPlaceAutocomplete = {
  baseUrl: string;
  query: string;
  boundsCenter?: TPlaceLatLng;
  boundsRadiusMiles?: number;
};

export async function getPlaceAutocomplete(props: TGetPlaceAutocomplete) {
  const {
    baseUrl,
    query,
    boundsCenter = LA_COUNTY_CENTER,
    boundsRadiusMiles = 10,
  } = props;

  if (query.length < 3) {
    return [];
  }

  // 1 degree of lat/long is approximately 69 miles
  const boundsRadiusDegrees = boundsRadiusMiles / 69;

  const areaBounds: google.maps.LatLngBoundsLiteral = {
    north: boundsCenter.lat + boundsRadiusDegrees,
    south: boundsCenter.lat - boundsRadiusDegrees,
    east: boundsCenter.lng + boundsRadiusDegrees,
    west: boundsCenter.lng - boundsRadiusDegrees,
  };

  const proxyUrl = `${baseUrl}/proxy/maps/api/place/autocomplete/json`;

  const autocompleteParams = formatAutocompleteParams({
    input: query,
    locationBias: areaBounds,
  });

  const response = await axios.get(proxyUrl, {
    params: autocompleteParams,
  });

  return response.data.predictions as TPlacesPrediction[];
}
