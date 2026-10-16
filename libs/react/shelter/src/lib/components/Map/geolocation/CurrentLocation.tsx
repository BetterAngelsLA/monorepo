import { mergeCss } from '@monorepo/react/shared';
import { PropsWithChildren } from 'react';
import { TLatLng } from '../types.maps';
import {
  TLocationError,
  getGeolocationErrorName,
} from './currentLocationError';

const POSITION_TIMEOUT_MS = 20 * 1000;

interface ICurrentLocation extends PropsWithChildren {
  onChange: (location: TLatLng) => void;
  onError?: (error: TLocationError) => void;
  className?: string;
  timeout?: number;
  /** Accessible name for the control — it renders an icon only. */
  label?: string;
  /** Stable hook for tests; the label above is what users hear. */
  testId?: string;
}

export function CurrentLocation(props: ICurrentLocation) {
  const {
    onChange,
    onError,
    timeout = POSITION_TIMEOUT_MS,
    className,
    children,
    label,
    testId,
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
      enableHighAccuracy: true,
      timeout, // error out if takes longer
      maximumAge: 0,
    };

    navigator.geolocation.getCurrentPosition(
      onLocationSuccess,
      onLocationError,
      options,
    );
  };

  if (!children) {
    return null;
  }

  const btnCss = ['w-full', 'h-full', className];

  return (
    <button
      aria-label={label}
      data-testid={testId}
      className={mergeCss(btnCss)}
      onClick={getLocation}
    >
      {children}
    </button>
  );
}
