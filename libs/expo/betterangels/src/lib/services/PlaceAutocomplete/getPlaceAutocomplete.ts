import axios from 'axios';

import { LA_CENTER_LAT_LNG } from './constants.google.maps';
import { TPlaceLatLng, TPlacesPrediction } from './types';

type TgetPlaceAutocomplete = {
  baseUrl: string;
  query: string;
  boundsCenter?: TPlaceLatLng;
  boundsRadiusMiles?: number;
};

export async function getPlaceAutocomplete(props: TgetPlaceAutocomplete) {
  const {
    baseUrl,
    query,
    boundsCenter = LA_CENTER_LAT_LNG,
    boundsRadiusMiles = 10,
  } = props;

  if (query.length < 3) {
    return [];
  }

  // 1 degree of lat/long is approximately 69 miles
  const boundsRadiusDegrees = boundsRadiusMiles / 69;

  const defaultBounds = {
    north: boundsCenter.lat + boundsRadiusDegrees,
    south: boundsCenter.lat - boundsRadiusDegrees,
    east: boundsCenter.lng + boundsRadiusDegrees,
    west: boundsCenter.lng - boundsRadiusDegrees,
  };

  const url = `${baseUrl}/proxy/maps/api/place/autocomplete/json`;

  const response = await axios.get(url, {
    params: {
      bounds: defaultBounds,
      input: query,
      components: 'country:us',
      strictBounds: true,
      withCredentials: true,
    },
  });

  return response.data.predictions as TPlacesPrediction[];
}
