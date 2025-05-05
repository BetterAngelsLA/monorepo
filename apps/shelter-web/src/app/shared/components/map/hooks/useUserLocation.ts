import { useCallback, useEffect, useState } from 'react';
import { getCurrentPosition } from '../utils/getCurrentPosition';
import { useGeolocationPermission } from './useGeolocationPermission';

type TReturns = {
  userLocation: google.maps.LatLngLiteral | null | undefined;
  fetchLocation: (onManualClick?: boolean) => void;
};

type TProps = {
  enabled: boolean;
  initialized: boolean;
  onLocateMe?: () => void;
};

export function useUserLocation(props: TProps): TReturns {
  const { enabled, initialized, onLocateMe } = props;

  const [userLocation, setUserLocation] = useState<
    google.maps.LatLngLiteral | null | undefined
  >(undefined);
  const permission = useGeolocationPermission();

  const fetchLocation = useCallback(async (onManualClick?: boolean) => {
    try {
      const location = await getCurrentPosition();

      setUserLocation(location);

      if (onManualClick) {
        onLocateMe?.();
      }
    } catch {
      setUserLocation(null);
    }
  }, []);

  useEffect(() => {
    if (!initialized || userLocation !== undefined) {
      return;
    }

    if (permission !== 'granted' || !enabled) {
      setUserLocation(null);
      return;
    }

    fetchLocation();
  }, [enabled, initialized, permission, userLocation, fetchLocation]);

  return { userLocation, fetchLocation };
}
