import {
  CSRF_COOKIE_NAME,
  CSRF_HEADER_NAME,
} from '@monorepo/expo/shared/utils';
import { LA_COUNTY_CENTER } from '@monorepo/expo/shared/ui-components';
import CookieManager from '@preeternal/react-native-cookie-manager';
import axios from 'axios';

import { TPlaceLatLng, TPlacePrediction } from './types';

const MILES_TO_METERS = 1609.34;

type TGetPlaceAutocomplete = {
  baseUrl: string;
  query: string;
  boundsCenter?: TPlaceLatLng;
  boundsRadiusMiles?: number;
};

type TPlacePredictionResponse = {
  suggestions: Array<{
    placePrediction?: {
      placeId: string;
      structuredFormat: {
        mainText: { text: string };
        secondaryText: { text: string };
      };
    };
  }>;
};

export async function getPlaceAutocomplete(
  props: TGetPlaceAutocomplete
): Promise<TPlacePrediction[]> {
  const {
    baseUrl,
    query,
    boundsCenter = LA_COUNTY_CENTER,
    boundsRadiusMiles = 10,
  } = props;

  if (query.length < 3) {
    return [];
  }

  const boundsRadiusMeters = boundsRadiusMiles * MILES_TO_METERS;

  const proxyUrl = `${baseUrl}/proxy/places/v1/places:autocomplete/`;

  const requestBody = {
    input: query,
    locationBias: {
      circle: {
        center: {
          latitude: boundsCenter.lat,
          longitude: boundsCenter.lng,
        },
        radius: boundsRadiusMeters,
      },
    },
    includedRegionCodes: ['us'],
  };

  // Get CSRF token from cookies
  const cookies = await CookieManager.get(baseUrl);
  const csrfToken = cookies[CSRF_COOKIE_NAME]?.value;

  const response = await axios.post<TPlacePredictionResponse>(
    proxyUrl,
    requestBody,
    {
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-FieldMask':
          'suggestions.placePrediction.placeId,suggestions.placePrediction.structuredFormat',
        ...(csrfToken && { [CSRF_HEADER_NAME]: csrfToken }),
      },
      withCredentials: true,
    }
  );

  return (response.data.suggestions || [])
    .filter(
      (
        s
      ): s is typeof s & {
        placePrediction: NonNullable<typeof s.placePrediction>;
      } => !!s.placePrediction
    )
    .map(({ placePrediction }) => {
      const mainText = placePrediction.structuredFormat?.mainText?.text || '';
      const secondaryText =
        placePrediction.structuredFormat?.secondaryText?.text || '';

      return {
        placeId: placePrediction.placeId,
        description: `${mainText}, ${secondaryText}`,
        mainText,
        secondaryText,
      };
    });
}
