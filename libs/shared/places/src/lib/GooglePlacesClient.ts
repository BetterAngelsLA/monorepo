import {
  TAddressComponent,
  TPlaceDetails,
  TPlaceLatLng,
  TPlacePrediction,
} from './types';

// ---- Defaults ----

const DEFAULT_BOUNDS_CENTER: TPlaceLatLng = {
  latitude: 34.04499,
  longitude: -118.251601,
};

const MILES_TO_METERS = 1609.34;

// ---- Option types ----

export type TAutocompleteOptions = {
  boundsCenter?: TPlaceLatLng;
  boundsRadiusMiles?: number;
  includedRegionCodes?: string[];
};

export type TGetDetailsOptions = {
  fields?: string;
};

export type TReverseGeocodeResult = {
  formattedAddress: string;
  shortAddress: string;
  addressComponents: TAddressComponent[];
};

// ---- Response types (internal) ----

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

/**
 * Optional platform-identification headers required by Google when
 * the API key is restricted to a specific iOS or Android app.
 */
export type TPlatformHeaders = {
  /** iOS bundle identifier, e.g. 'la.betterangels.app' */
  iosBundleId?: string;
  /** Android package name, e.g. 'la.betterangels.app' */
  androidPackage?: string;
  /** Android signing-certificate SHA-1 fingerprint (uppercase hex, no colons) */
  androidCertFingerprint?: string;
};

/**
 * A client for the Google Places & Geocoding REST APIs.
 *
 * Instantiate once with your API key; every method call uses it
 * automatically — no need to pass the key around.
 *
 * ```ts
 * const client = new GooglePlacesClient(apiKey);
 * const results = await client.autocomplete('pizza');
 * ```
 */
export class GooglePlacesClient {
  private readonly apiKey: string;
  private readonly platformHeaders: Record<string, string>;

  constructor(apiKey: string, platform?: TPlatformHeaders) {
    this.apiKey = apiKey;

    const headers: Record<string, string> = {};
    if (platform?.iosBundleId) {
      headers['X-Ios-Bundle-Identifier'] = platform.iosBundleId;
    }
    if (platform?.androidPackage) {
      headers['X-Android-Package'] = platform.androidPackage;
    }
    if (platform?.androidCertFingerprint) {
      headers['X-Android-Cert'] = platform.androidCertFingerprint;
    }
    this.platformHeaders = headers;
  }

  // ---- Public API ----

  async autocomplete(
    query: string,
    options?: TAutocompleteOptions
  ): Promise<TPlacePrediction[]> {
    const {
      boundsCenter = DEFAULT_BOUNDS_CENTER,
      boundsRadiusMiles = 10,
      includedRegionCodes = ['us'],
    } = options ?? {};

    if (query.length < 3) return [];

    const response = await this.placesFetch(
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
              radius: boundsRadiusMiles * MILES_TO_METERS,
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

  async getDetails(
    placeId: string,
    options?: TGetDetailsOptions
  ): Promise<TPlaceDetails> {
    const {
      fields = 'displayName,formattedAddress,location,addressComponents',
    } = options ?? {};

    const response = await this.placesFetch(
      `https://places.googleapis.com/v1/places/${placeId}`,
      {
        method: 'GET',
        headers: {
          'X-Goog-FieldMask': fields,
        },
      }
    );

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

  async reverseGeocode(
    latitude: number,
    longitude: number
  ): Promise<TReverseGeocodeResult> {
    const params = new URLSearchParams({
      latlng: `${latitude},${longitude}`,
      key: this.apiKey,
    });

    const headers = new Headers();
    for (const [k, v] of Object.entries(this.platformHeaders)) {
      headers.set(k, v);
    }

    const response = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?${params.toString()}`,
      { headers }
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

  // ---- Private helpers ----

  /**
   * Fetch wrapper for Places API (v1) — injects API key as header.
   */
  private async placesFetch(
    url: string,
    options: RequestInit = {}
  ): Promise<Response> {
    const headers = new Headers(options.headers);
    headers.set('X-Goog-Api-Key', this.apiKey);
    if (!headers.has('Content-Type')) {
      headers.set('Content-Type', 'application/json');
    }
    for (const [k, v] of Object.entries(this.platformHeaders)) {
      headers.set(k, v);
    }

    const response = await fetch(url, { ...options, headers });

    return response;
  }
}
