import axios from 'axios';

import { TPlacesPrediction } from './types';

// geocode for approx center of LA COUNTY
const LA_COUNTY_LAT = 34.04499;
const LA_COUNTY_LNG = -118.251601;

const LA_RADIUS_MILES = 10;
// 1 degree of lat/long is approximately 69 miles
const DISTANCE_FROM_CENTER_DEGREES = LA_RADIUS_MILES / 69;

type TSearchPlacesLA = {
  baseUrl: string;
  query: string;
};

export async function searchPlacesLA(props: TSearchPlacesLA) {
  const { baseUrl, query } = props;

  if (query.length < 3) {
    return [];
  }

  const losAngelesCenter = { lat: LA_COUNTY_LAT, lng: LA_COUNTY_LNG };

  const defaultBounds = {
    north: losAngelesCenter.lat + DISTANCE_FROM_CENTER_DEGREES,
    south: losAngelesCenter.lat - DISTANCE_FROM_CENTER_DEGREES,
    east: losAngelesCenter.lng + DISTANCE_FROM_CENTER_DEGREES,
    west: losAngelesCenter.lng - DISTANCE_FROM_CENTER_DEGREES,
  };

  const url = `${baseUrl}/proxy/maps/api/place/autocomplete/json`;

  const response = await axios.get(url, {
    params: {
      bounds: defaultBounds,
      input: query,
      components: 'country:us',
      strictBounds: true, // DO WE WANT STRICT?
      withCredentials: true,
    },
  });

  return response.data.predictions as TPlacesPrediction[];
}
