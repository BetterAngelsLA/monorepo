import { useCallback, useEffect, useState } from 'react';
import { getCurrentPosition } from '../utils/getCurrentPosition';
import { useGeolocationPermission } from './useGeolocationPermission';

export function useUserLocation(
  enabled: boolean,
  initialized: boolean
): {
  userLocation: google.maps.LatLngLiteral | null | undefined;
  fetchLocation: () => void;
} {
  const [userLocation, setUserLocation] = useState<
    google.maps.LatLngLiteral | null | undefined
  >(undefined);
  const permission = useGeolocationPermission();

  const fetchLocation = useCallback(async () => {
    try {
      const location = await getCurrentPosition();

      setUserLocation(location);
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
