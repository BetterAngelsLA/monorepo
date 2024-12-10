import { MutableRefObject, useEffect, useRef } from 'react';
import { TLatLng } from './maps/types.maps';

const POSITION_TIMEOUT_MS = 20 * 1000;

export type TLocationError =
  | 'PERMISSION_DENIED'
  | 'POSITION_UNAVAILABLE'
  | 'TIMEOUT'
  | 'FEATURE_UNAVAILABLE'
  | 'UNKNOWN';

const GeolocationErrorNames = {
  1: 'PERMISSION_DENIED',
  2: 'POSITION_UNAVAILABLE',
  3: 'TIMEOUT',
} as const;

type GeolocationErrorKey = keyof typeof GeolocationErrorNames;

function getGeolocationErrorName(
  errorCode: GeolocationErrorKey
): TLocationError {
  return GeolocationErrorNames[errorCode];
}

type TLocationResult = {
  location: TLatLng;
};

type TErrorResult = {
  error: TLocationError;
};

type TLoading = {
  loading: boolean;
};

export type TCurrentLocationResult = TLocationResult | TErrorResult | TLoading;

type ICurrentLocation = {
  onChange: (result: TCurrentLocationResult) => void;
};

export function CurrentLocation(props: ICurrentLocation) {
  const { onChange } = props;
  const stableRef: MutableRefObject<number> = useRef<number>(0);

  const onLocationSuccess = (position: GeolocationPosition): void => {
    if (onChange) {
      onChange({
        location: {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        },
      });
    }
  };

  const onLocationError = (err: GeolocationPositionError): void => {
    onChange({
      error: getGeolocationErrorName(err.code as GeolocationErrorKey),
    });
  };

  const getLocation = (): void => {
    const options: PositionOptions = {
      enableHighAccuracy: true,
      timeout: POSITION_TIMEOUT_MS, // error out if takes longer
      maximumAge: 0,
    };

    onChange({
      loading: true,
    });

    navigator.geolocation.getCurrentPosition(
      onLocationSuccess,
      onLocationError,
      options
    );
  };

  if (!navigator.geolocation) {
    onChange({
      error: 'FEATURE_UNAVAILABLE',
    });

    return null;
  }

  useEffect(() => {
    if (stableRef.current > 0) {
      return;
    }

    stableRef.current = 1;

    getLocation();
  }, [getLocation]);

  return null;
}
