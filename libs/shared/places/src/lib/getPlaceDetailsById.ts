import { TFetchClient, TPlaceDetails } from './types';

type TGetPlaceDetailsByIdProps = {
  fetchClient: TFetchClient;
  placeId: string;
  fields?: string;
};

/**
 * Get place details by place ID using the Google Places API (v1).
 */
export async function getPlaceDetailsById(
  props: TGetPlaceDetailsByIdProps
): Promise<TPlaceDetails> {
  const {
    fetchClient,
    placeId,
    fields = 'displayName,formattedAddress,location,addressComponents',
  } = props;

  const response = await fetchClient(`/proxy/places/v1/places/${placeId}/`, {
    method: 'GET',
    headers: {
      'X-Goog-FieldMask': fields,
    },
  });

  if (!response.ok) {
    throw new Error(`Place details request failed: ${response.status}`);
  }

  const data = await response.json();

  return {
    displayName: data.displayName?.text || undefined,
    formattedAddress: data.formattedAddress || undefined,
    location: data.location
      ? {
          latitude: data.location.latitude,
          longitude: data.location.longitude,
        }
      : undefined,
    addressComponents: data.addressComponents?.map(
      (c: { longText: string; shortText: string; types: string[] }) => ({
        longText: c.longText,
        shortText: c.shortText,
        types: c.types,
      })
    ),
  };
}
