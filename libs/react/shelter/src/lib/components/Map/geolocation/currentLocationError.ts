export type TLocationError =
  | 'PERMISSION_DENIED'
  | 'POSITION_UNAVAILABLE'
  | 'TIMEOUT'
  | 'FEATURE_UNAVAILABLE'
  | 'UNKNOWN';

const GeolocationErrorNameMap = {
  1: 'PERMISSION_DENIED',
  2: 'POSITION_UNAVAILABLE',
  3: 'TIMEOUT',
} as const;

export type GeolocationErrorKey = keyof typeof GeolocationErrorNameMap;

export function getGeolocationErrorName(
  errorCode: GeolocationErrorKey
): TLocationError {
  return GeolocationErrorNameMap[errorCode];
}
