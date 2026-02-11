import { TPlaceLatLng, TPlacePrediction } from './types';

const DEFAULT_BOUNDS_CENTER: TPlaceLatLng = {
  lat: 34.04499,
  lng: -118.251601,
};

const MILES_TO_METERS = 1609.34;

type TAutocompleteSuggestion = {
  placePrediction?: {
    placeId: string;
    structuredFormat: {
      mainText: { text: string };
      secondaryText: { text: string };
    };
  };
};

type TGetPlaceAutocompleteProps = {
  fetchClient: (path: string, options?: RequestInit) => Promise<Response>;
  query: string;
  boundsCenter?: TPlaceLatLng;
  boundsRadiusMiles?: number;
  includedRegionCodes?: string[];
};

export async function getPlaceAutocomplete(
  props: TGetPlaceAutocompleteProps
): Promise<TPlacePrediction[]> {
  const {
    fetchClient,
    query,
    boundsCenter = DEFAULT_BOUNDS_CENTER,
    boundsRadiusMiles = 25,
    includedRegionCodes = ['us'],
  } = props;

  if (query.length < 3) {
    return [];
  }

  const response = await fetchClient('/proxy/places/v1/places:autocomplete/', {
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
            latitude: boundsCenter.lat,
            longitude: boundsCenter.lng,
          },
          radius: boundsRadiusMiles * MILES_TO_METERS,
        },
      },
      includedRegionCodes,
    }),
  });

  if (!response.ok) {
    throw new Error(`Autocomplete request failed: ${response.status}`);
  }

  const data: { suggestions: TAutocompleteSuggestion[] } =
    await response.json();

  return (data.suggestions || [])
    .filter(
      (
        s
      ): s is {
        placePrediction: NonNullable<
          TAutocompleteSuggestion['placePrediction']
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
