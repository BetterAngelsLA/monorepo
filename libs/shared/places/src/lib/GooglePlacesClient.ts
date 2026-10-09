import { milesToMeters } from '@monorepo/shared/units';

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
 * Route Places/Geocoding traffic through the BA backend proxy instead of
 * calling Google directly.
 *
 * The proxy (``apps/betterangels-backend/proxy/``) holds its own Google key
 * server-side. A browser cannot use the native keys: they are restricted by
 * bundle id / package name + signing certificate, and the headers that satisfy
 * that restriction cannot be set from a page. The proxy is ``@login_required``,
 * so pass the application's own fetch client — it carries the session cookie,
 * the CSRF header, and the org header.
 *
 * Native leaves this unset and keeps calling Google directly, which is one
 * fewer hop.
 */
export interface TPlacesProxy {
  /** Origin of the BA API, e.g. ``https://api.dev.betterangels.la``. */
  apiUrl: string;
  /** Application fetch client (credentials + CSRF included). */
  fetch: typeof fetch;
}

let placesProxy: TPlacesProxy | null = null;

/** Install (or clear, with ``null``) the platform proxy. */
export const configurePlacesProxy = (proxy: TPlacesProxy | null): void => {
  placesProxy = proxy;
};

/**
 * A client for the Google Places & Geocoding REST APIs.
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
    options?: TAutocompleteOptions,
  ): Promise<TPlacePrediction[]> {
    const {
      boundsCenter = DEFAULT_BOUNDS_CENTER,
      boundsRadiusMiles = 10,
      includedRegionCodes = ['us'],
    } = options ?? {};

    if (query.length < 3) return [];

    const response = await this.placesFetch(
      this.placesUrl('places:autocomplete'),
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
              radius: milesToMeters(boundsRadiusMiles),
            },
          },
          includedRegionCodes,
        }),
      },
    );

    if (!response.ok) {
      throw new Error(`Autocomplete request failed: ${response.status}`);
    }

    const data: TPlacePredictionResponse = await response.json();

    return (data.suggestions || [])
      .filter(
        (
          s,
        ): s is {
          placePrediction: NonNullable<
            TPlacePredictionResponse['suggestions'][number]['placePrediction']
          >;
        } => !!s.placePrediction,
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
    options?: TGetDetailsOptions,
  ): Promise<TPlaceDetails> {
    const {
      fields = 'displayName,formattedAddress,location,addressComponents',
    } = options ?? {};

    const response = await this.placesFetch(
      this.placesUrl(`places/${placeId}`),
      {
        method: 'GET',
        headers: {
          'X-Goog-FieldMask': fields,
        },
      },
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
      viewport: data.viewport
        ? {
            low: {
              latitude: data.viewport.low.latitude,
              longitude: data.viewport.low.longitude,
            },
            high: {
              latitude: data.viewport.high.latitude,
              longitude: data.viewport.high.longitude,
            },
          }
        : undefined,
      addressComponents: data.addressComponents?.map(
        (c: { longText: string; shortText: string; types: string[] }) => ({
          longText: c.longText,
          shortText: c.shortText,
          types: c.types,
        }),
      ),
    };
  }

  async reverseGeocode(
    latitude: number,
    longitude: number,
  ): Promise<TReverseGeocodeResult> {
    const params = new URLSearchParams({
      latlng: `${latitude},${longitude}`,
      key: this.apiKey,
    });

    const headers = new Headers();
    for (const [k, v] of Object.entries(this.platformHeaders)) {
      headers.set(k, v);
    }

    const response = await this.fetchImpl(this.geocodeUrl(params), { headers });

    if (!response.ok) {
      throw new Error(`Reverse geocode request failed: ${response.status}`);
    }

    const data = await response.json();

    // The Geocoding API reports most failures with HTTP 200 and a `status` field,
    // so `response.ok` alone is not enough. Without this check a REQUEST_DENIED or
    // OVER_QUERY_LIMIT would fall through to the coordinate fallback below and look
    // like a successful reverse geocode of the raw lat/lng — silently attaching a
    // bogus "34.05, -118.24" address to an interaction.
    //
    // ZERO_RESULTS is deliberately allowed through: there genuinely is no address
    // for that point, and the coordinate fallback is the right answer there.
    const status: unknown = data.status;

    if (
      typeof status === 'string' &&
      status !== 'OK' &&
      status !== 'ZERO_RESULTS'
    ) {
      const detail =
        typeof data.error_message === 'string'
          ? ` — ${data.error_message}`
          : '';

      throw new Error(`Reverse geocode failed: ${status}${detail}`);
    }

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
        }),
      ),
    };
  }

  // ---- Private helpers ----

  /**
   * URL for a Places API (New) path.
   *
   * The proxy route is `places/v1/<path>/` — with a trailing slash, or Django
   * redirects the POST and loses the body.
   */
  private placesUrl(path: string): string {
    if (placesProxy) {
      return `${placesProxy.apiUrl}/proxy/places/v1/${path}/`;
    }

    return `https://places.googleapis.com/v1/${path}`;
  }

  /** URL for the Geocoding API; the proxy injects the key server-side. */
  private geocodeUrl(params: URLSearchParams): string {
    if (placesProxy) {
      const proxied = new URLSearchParams(params);
      proxied.delete('key');
      return `${placesProxy.apiUrl}/proxy/maps/api/geocode/json/?${proxied.toString()}`;
    }

    return `https://maps.googleapis.com/maps/api/geocode/json?${params.toString()}`;
  }

  private get fetchImpl(): typeof fetch {
    return placesProxy?.fetch ?? fetch;
  }

  /**
   * Fetch wrapper for Places API (v1) — injects API key as header.
   *
   * When proxied there is no key or platform header to send: the backend holds
   * the key and the browser could not satisfy the platform restrictions anyway.
   * `X-Goog-FieldMask` is still sent, and the proxy forwards it.
   */
  private async placesFetch(
    url: string,
    options: RequestInit = {},
  ): Promise<Response> {
    const headers = new Headers(options.headers);

    if (!placesProxy) {
      headers.set('X-Goog-Api-Key', this.apiKey);
      for (const [k, v] of Object.entries(this.platformHeaders)) {
        headers.set(k, v);
      }
    }

    if (!headers.has('Content-Type')) {
      headers.set('Content-Type', 'application/json');
    }

    return this.fetchImpl(url, { ...options, headers });
  }
}
