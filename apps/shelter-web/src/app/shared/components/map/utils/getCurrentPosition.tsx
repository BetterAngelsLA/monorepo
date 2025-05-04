import { toGoogleLatLngLiteral } from './toGoogleLatLngLiteral';

const POSITION_TIMEOUT_MS = 10 * 1000;

export type TLocationError =
  | 'PERMISSION_DENIED'
  | 'POSITION_UNAVAILABLE'
  | 'TIMEOUT'
  | 'FEATURE_UNAVAILABLE'
  | 'UNKNOWN';

const GeolocationErrorNameMap: Record<
  GeolocationPositionError['code'],
  TLocationError
> = {
  [1]: 'PERMISSION_DENIED',
  [2]: 'POSITION_UNAVAILABLE',
  [3]: 'TIMEOUT',
};

export type GeolocationErrorKey = keyof typeof GeolocationErrorNameMap;

export function getGeolocationErrorName(errorCode: number): TLocationError {
  return GeolocationErrorNameMap[errorCode as GeolocationErrorKey] ?? 'UNKNOWN';
}

export class CurrentPositionError extends Error {
  constructor(type: TLocationError, message?: string) {
    super(message || type);
    this.name = type;
  }
}

type TProps = {
  timeout?: number;
};

export async function getCurrentPosition(
  props?: TProps
): Promise<google.maps.LatLngLiteral> {
  const { timeout = POSITION_TIMEOUT_MS } = props || {};

  if (!navigator.geolocation) {
    throw new CurrentPositionError('FEATURE_UNAVAILABLE');
  }

  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve(toGoogleLatLngLiteral(position.coords));
      },
      (error: GeolocationPositionError) => {
        console.error(`[getCurrentPosition]: ${error}`);
        reject(
          new CurrentPositionError(
            getGeolocationErrorName(error.code),
            error.message
          )
        );
      },
      {
        enableHighAccuracy: true,
        timeout: timeout,
        maximumAge: 0,
      }
    );
  });
}
