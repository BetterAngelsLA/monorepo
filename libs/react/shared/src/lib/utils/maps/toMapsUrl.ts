import { isIOSBrowser } from '../platform';

const GOOGLE_MAPS_BASE_URL = 'https://www.google.com/maps';
const APPLE_MAPS_BASE_URL = 'https://maps.apple.com';

/**
 * `"google"` (default) — Google Maps on every platform.
 * `"auto"` — Apple Maps on iOS, Google Maps everywhere else.
 */
export type TMapsProvider = 'google' | 'auto';

type TParams = {
  latitude?: number | null;
  longitude?: number | null;
  /** Human-readable address — a venue name or a street address. */
  address?: string | null;
  provider?: TMapsProvider;
};

/**
 * Picks what maps should point at: `"latitude,longitude"` when both are present
 * and finite, otherwise the trimmed `address`. `null` when neither is usable.
 */
function toCoordinatesOrAddress(params: TParams): string | null {
  const { latitude, longitude, address } = params;

  const hasCoordinates =
    typeof latitude === 'number' &&
    typeof longitude === 'number' &&
    Number.isFinite(latitude) &&
    Number.isFinite(longitude);

  if (hasCoordinates) {
    return `${latitude},${longitude}`;
  }

  return address?.trim() || null;
}

/**
 * Builds a maps URL for a location.
 *
 * Defaults to Google Maps on every platform — Google Maps hands off to its
 * native app on Android, and iOS users get the Google Maps web app. Pass
 * `provider: 'auto'` to send iOS browsers to Apple Maps (universal link)
 * instead. Coordinates win over `address` when both are set. Returns `null` when
 * there is nothing to point at.
 */
export function toMapsUrl(params: TParams): string | null {
  const { provider = 'google' } = params;

  const destination = toCoordinatesOrAddress(params);

  if (!destination) {
    return null;
  }

  const encodedDestination = encodeURIComponent(destination);

  if (provider === 'auto' && isIOSBrowser()) {
    return `${APPLE_MAPS_BASE_URL}/?daddr=${encodedDestination}`;
  }

  return `${GOOGLE_MAPS_BASE_URL}/dir/?api=1&destination=${encodedDestination}`;
}
