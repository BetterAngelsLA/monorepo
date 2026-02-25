import { mergeCss } from '@monorepo/react/shared';
import { PropsWithChildren } from 'react';
import { TLatLng } from '../Map/types.maps';
import {
  TLocationError,
  getGeolocationErrorName,
} from './CurrentLocationError';

const POSITION_TIMEOUT_MS = 20 * 1000;

interface ICurrentLocation extends PropsWithChildren {
  onChange: (location: TLatLng) => void;
  onError?: (error: TLocationError) => void;
  className?: string;
  timeout?: number;
  enableHighAccuracy?: boolean;
  maximumAge?: number;
}

export function CurrentLocation(props: ICurrentLocation) {
  const {
    onChange,
    onError,
    timeout = POSITION_TIMEOUT_MS,
    enableHighAccuracy = true,
    maximumAge = 0,
    className,
    children,
  } = props;

  if (typeof navigator === 'undefined' || !navigator.geolocation) {
    onError?.('FEATURE_UNAVAILABLE');

    return null;
  }

  const onLocationSuccess = (position: GeolocationPosition): void => {
    onChange({
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
    });
  };

  const onLocationError = (err: GeolocationPositionError): void => {
    onError?.(getGeolocationErrorName(err.code));
  };

  const getLocation = (): void => {
    const options: PositionOptions = {
      enableHighAccuracy,
      timeout,
      maximumAge,
    };

    navigator.geolocation.getCurrentPosition(
      onLocationSuccess,
      onLocationError,
      options
    );
  };

  if (!children) {
    return null;
  }

  const btnCss = ['w-full', 'h-full', className];

  return (
    <button className={mergeCss(btnCss)} onClick={getLocation}>
      {children}
    </button>
  );
}
