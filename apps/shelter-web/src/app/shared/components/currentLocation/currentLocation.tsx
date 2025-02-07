import { PropsWithChildren } from 'react';
import { mergeCss } from '../../utils/styles/mergeCss';
import { TLatLng } from '../map/types.maps';
import {
  GeolocationErrorKey,
  TLocationError,
  getGeolocationErrorName,
} from './currentLocationError';

const POSITION_TIMEOUT_MS = 20 * 1000;

interface ICurrentLocation extends PropsWithChildren {
  onChange: (location: TLatLng) => void;
  onError: (error: TLocationError) => void;
  className?: string;
  timeout?: number;
}

export function CurrentLocation(props: ICurrentLocation) {
  const {
    onChange,
    onError,
    timeout = POSITION_TIMEOUT_MS,
    className,
    children,
  } = props;

  if (!navigator.geolocation) {
    onError && onError('FEATURE_UNAVAILABLE');

    return null;
  }

  const onLocationSuccess = (position: GeolocationPosition): void => {
    onChange &&
      onChange({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      });
  };

  const onLocationError = (err: GeolocationPositionError): void => {
    onError &&
      onError(getGeolocationErrorName(err.code as GeolocationErrorKey));
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
