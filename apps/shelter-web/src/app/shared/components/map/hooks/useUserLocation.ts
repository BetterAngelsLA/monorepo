import { useCallback, useEffect, useState } from 'react';
import { getCurrentPosition } from '../utils/getCurrentPosition';
import { useGeolocationPermission } from './useGeolocationPermission';

export function useUserLocation(
  userLocationEnabled: boolean,
  mapInitialized: boolean
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

      console.log('--------  setUserLocation:', location);

      setUserLocation(location);

      // setUserLocation((prev) => {
      //   if (
      //     prev != null &&
      //     prev.lat === location.lat &&
      //     prev.lng === location.lng
      //   ) {
      //     console.log(
      //       '################################### setUserLocation SKIP '
      //     );
      //     return prev;
      //   }

      //   console.log(
      //     '################################### setUserLocation SET NEW'
      //   );
      //   return location;
      // });
    } catch (e) {
      console.error('############# useUserLocation CATCH: ', e);

      console.log(
        '################################### SET LOCATION A ---> NULL'
      );
      setUserLocation(null);
    }
  }, []);

  // fetchLocation
  useEffect(() => {
    // Skip if:
    // 1. no map
    // 2. userLocation already defined (including null)
    if (!mapInitialized || userLocation !== undefined) {
      return;
    }

    // TODO: FIX or CLARIFY logic
    // Skip and set setUserLocation to null if:
    // 1. Permission denied
    // 2. UserLocation disabled
    // if (permission === 'denied' || !userLocationEnabled) {
    if (permission !== 'granted' || !userLocationEnabled) {
      setUserLocation(null);

      return;
    }

    fetchLocation();
  }, [
    userLocationEnabled,
    mapInitialized,
    permission,
    userLocation,
    fetchLocation,
  ]);

  return { userLocation, fetchLocation };
}
