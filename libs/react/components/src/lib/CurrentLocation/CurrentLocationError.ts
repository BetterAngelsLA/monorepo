export type TLocationError =
  | 'PERMISSION_DENIED'
  | 'POSITION_UNAVAILABLE'
  | 'TIMEOUT'
  | 'FEATURE_UNAVAILABLE'
  | 'UNKNOWN';

const GeolocationErrorNameMap: Record<number, TLocationError> = {
  1: 'PERMISSION_DENIED',
  2: 'POSITION_UNAVAILABLE',
  3: 'TIMEOUT',
};

export function getGeolocationErrorName(errorCode: number): TLocationError {
  return GeolocationErrorNameMap[errorCode] ?? 'UNKNOWN';
}
