import {
  TAddressComponent,
  TPlaceDetails,
  TPlacePrediction,
  TReverseGeocodeResult,
} from '@monorepo/shared/places';
import { useMapsLibrary } from '@vis.gl/react-google-maps';
import { useCallback, useMemo } from 'react';

/**
 * Returns a Places client backed by the Google Maps JS SDK libraries
 * loaded via `<APIProvider>` from `@vis.gl/react-google-maps`.
 *
 * No API key handling needed — key is provided by the APIProvider.
 * Calls the SDK directly (no REST, no fetch, no proxy).
 */
export function usePlacesClient() {
  const placesLib = useMapsLibrary('places');
  const geocodingLib = useMapsLibrary('geocoding');

  const autocomplete = useCallback(
    async (
      query: string,
      options?: {
        boundsCenter?: { latitude: number; longitude: number };
        boundsRadiusMiles?: number;
        includedRegionCodes?: string[];
      }
    ): Promise<TPlacePrediction[]> => {
      if (!placesLib || query.length < 3) return [];

      const {
        boundsCenter = { latitude: 34.04499, longitude: -118.251601 },
        boundsRadiusMiles = 10,
        includedRegionCodes = ['us'],
      } = options ?? {};

      const request: google.maps.places.AutocompleteRequest = {
        input: query,
        locationBias: new google.maps.Circle({
          center: {
            lat: boundsCenter.latitude,
            lng: boundsCenter.longitude,
          },
          radius: boundsRadiusMiles * 1609.34,
        }),
        includedRegionCodes,
      };

      const { suggestions } =
        await google.maps.places.AutocompleteSuggestion.fetchAutocompleteSuggestions(
          request
        );

      return suggestions
        .filter((s) => !!s.placePrediction)
        .map((s) => {
          const p = s.placePrediction!;
          const mainText = p.mainText?.text || '';
          const secondaryText = p.secondaryText?.text || '';

          return {
            placeId: p.placeId || '',
            description: `${mainText}, ${secondaryText}`,
            mainText,
            secondaryText,
          };
        });
    },
    [placesLib]
  );

  const getDetails = useCallback(
    async (
      placeId: string,
      options?: { fields?: string }
    ): Promise<TPlaceDetails> => {
      if (!placesLib) throw new Error('Places library not loaded');

      const fieldList = (
        options?.fields ||
        'displayName,formattedAddress,location,addressComponents'
      ).split(',');

      const place = new google.maps.places.Place({ id: placeId });
      await place.fetchFields({ fields: fieldList });

      return {
        displayName: place.displayName || undefined,
        formattedAddress: place.formattedAddress || undefined,
        location: place.location
          ? {
              latitude: place.location.lat(),
              longitude: place.location.lng(),
            }
          : undefined,
        addressComponents: place.addressComponents?.map(
          (c): TAddressComponent => ({
            longText: c.longText || '',
            shortText: c.shortText || '',
            types: c.types,
          })
        ),
      };
    },
    [placesLib]
  );

  const reverseGeocode = useCallback(
    async (
      latitude: number,
      longitude: number
    ): Promise<TReverseGeocodeResult> => {
      if (!geocodingLib) throw new Error('Geocoding library not loaded');

      const geocoder = new google.maps.Geocoder();
      const response = await geocoder.geocode({
        location: { lat: latitude, lng: longitude },
      });

      const result = response.results[0];
      const formattedAddress =
        result?.formatted_address || `${latitude}, ${longitude}`;
      const shortAddress =
        formattedAddress.split(', ')[0] ||
        `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`;

      return {
        formattedAddress,
        shortAddress,
        addressComponents: (result?.address_components || []).map(
          (c): TAddressComponent => ({
            longText: c.long_name,
            shortText: c.short_name,
            types: c.types,
          })
        ),
      };
    },
    [geocodingLib]
  );

  return useMemo(
    () => ({ autocomplete, getDetails, reverseGeocode }),
    [autocomplete, getDetails, reverseGeocode]
  );
}
