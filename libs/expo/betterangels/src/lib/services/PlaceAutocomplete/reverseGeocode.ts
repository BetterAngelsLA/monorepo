import axios from 'axios';
import { TAddressComponent } from './types';

export type TReverseGeocodeResult = {
  formattedAddress: string;
  shortAddress: string;
  addressComponents: TAddressComponent[];
};

type TReverseGeocodeProps = {
  baseUrl: string;
  latitude: number;
  longitude: number;
};

/**
 * Reverse geocode coordinates to an address using the Google Geocoding API.
 */
export async function reverseGeocode(
  props: TReverseGeocodeProps
): Promise<TReverseGeocodeResult> {
  const { baseUrl, latitude, longitude } = props;

  const response = await axios.get(`${baseUrl}/proxy/maps/api/geocode/json`, {
    params: { latlng: `${latitude},${longitude}` },
    withCredentials: true,
  });

  const result = response.data.results?.[0];
  const formattedAddress =
    result?.formatted_address || `${latitude}, ${longitude}`;
  const shortAddress =
    result?.formatted_address?.split(', ')[0] ||
    `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`;

  return {
    formattedAddress,
    shortAddress,
    addressComponents: result?.address_components || [],
  };
}
