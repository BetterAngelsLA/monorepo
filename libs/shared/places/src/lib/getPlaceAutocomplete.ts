import { TGoogleFetch } from './googleFetch';
import { TPlaceLatLng, TPlacePrediction } from './types';

// Default bias center for autocomplete (approx center of LA County).
const DEFAULT_BOUNDS_CENTER: TPlaceLatLng = {
  latitude: 34.04499,
  longitude: -118.251601,
};

const MILES_TO_METERS = 1609.34;

type TGetPlaceAutocompleteProps = {
  googleFetch: TGoogleFetch;
  query: string;
  boundsCenter?: TPlaceLatLng;
  boundsRadiusMiles?: number;
  includedRegionCodes?: string[];
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
  props: TGetPlaceAutocompleteProps
): Promise<TPlacePrediction[]> {
  const {
    googleFetch,
    query,
    boundsCenter = DEFAULT_BOUNDS_CENTER,
    boundsRadiusMiles = 10,
    includedRegionCodes = ['us'],
  } = props;

  if (query.length < 3) {
    return [];
  }

  const boundsRadiusMeters = boundsRadiusMiles * MILES_TO_METERS;

  const response = await googleFetch(
    'https://places.googleapis.com/v1/places:autocomplete',
    {
      method: 'POST',
      headers: {
        'X-Goog-FieldMask':
          'suggestions.placePrediction.placeId,suggestions.placePrediction.structuredFormat',
      },
      body: JSON.stringify({
        input: query,
        locationBias: {
          circle: {
            center: {
              latitude: boundsCenter.latitude,
              longitude: boundsCenter.longitude,
            },
            radius: boundsRadiusMeters,
          },
        },
        includedRegionCodes,
      }),
    }
  );

  if (!response.ok) {
    throw new Error(`Autocomplete request failed: ${response.status}`);
  }

  const data: TPlacePredictionResponse = await response.json();

  return (data.suggestions || [])
    .filter(
      (
        s
      ): s is {
        placePrediction: NonNullable<
          TPlacePredictionResponse['suggestions'][number]['placePrediction']
        >;
      } => !!s.placePrediction
    )
    .map((s) => {
      const { placeId, structuredFormat } = s.placePrediction;
      const mainText = structuredFormat?.mainText?.text || '';
      const secondaryText = structuredFormat?.secondaryText?.text || '';

      return {
        placeId,
        description: `${mainText}, ${secondaryText}`,
        mainText,
        secondaryText,
      };
    });
}
