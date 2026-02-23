import { TGoogleFetch } from './googleFetch';
import { TAddressComponent } from './types';

export type TReverseGeocodeResult = {
  formattedAddress: string;
  shortAddress: string;
  addressComponents: TAddressComponent[];
};

type TReverseGeocodeProps = {
  googleFetch: TGoogleFetch;
  latitude: number;
  longitude: number;
};

/**
 * Reverse geocode coordinates to an address using the Google Geocoding API.
 */
export async function reverseGeocode(
  props: TReverseGeocodeProps
): Promise<TReverseGeocodeResult> {
  const { googleFetch, latitude, longitude } = props;

  const params = new URLSearchParams({
    latlng: `${latitude},${longitude}`,
  });

  const response = await googleFetch(
    `https://maps.googleapis.com/maps/api/geocode/json?${params.toString()}`
  );

  if (!response.ok) {
    throw new Error(`Reverse geocode request failed: ${response.status}`);
  }

  const data = await response.json();
  const result = data.results?.[0];
  const formattedAddress =
    result?.formatted_address || `${latitude}, ${longitude}`;
  const shortAddress =
    result?.formatted_address?.split(', ')[0] ||
    `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`;

  return {
    formattedAddress,
    shortAddress,
    addressComponents: (result?.address_components || []).map(
      (c: { long_name: string; short_name: string; types: string[] }) => ({
        longText: c.long_name,
        shortText: c.short_name,
        types: c.types,
      })
    ),
  };
}
