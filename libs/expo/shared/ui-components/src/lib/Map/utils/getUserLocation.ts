import {
  Accuracy,
  LocationObject,
  getCurrentPositionAsync,
  getForegroundPermissionsAsync,
  getLastKnownPositionAsync,
  requestForegroundPermissionsAsync,
} from 'expo-location';

export type TGetUserLocationResponse = {
  location?: LocationObject;
  requireSettingsUpdate?: true;
};

/**
 * Get the user's current device location.
 *
 * Strategy:
 * 1. Try `getLastKnownPositionAsync` first — instant, returns the OS-cached
 *    location without powering up GPS.  Works with emulator mock locations.
 * 2. Fall back to `getCurrentPositionAsync` if no cached position exists.
 */
export async function getUserLocation(): Promise<TGetUserLocationResponse | null> {
  try {
    const existingPerms = await getForegroundPermissionsAsync();

    // if permission already granted, fetch location and return
    if (existingPerms.granted) {
      const userCurrentLocation = await fetchLocation();

      return {
        location: userCurrentLocation,
      };
    }

    // permission not granted, so let's request permission from user
    const newPerms = await requestForegroundPermissionsAsync();

    // if permission now granted, fetch location and return
    if (newPerms.granted) {
      const userCurrentLocation = await fetchLocation();

      return {
        location: userCurrentLocation,
      };
    }

    // if `canAskAgain` changed, we assume that the user has actively
    // updated permission, so do nothing this time.
    // mostly for Android, where `canAskAgain` works differently, but ok for both
    if (existingPerms.canAskAgain !== newPerms.canAskAgain) {
      return null;
    }

    // if we cannot ask for permission again,
    // user needs to update settings first and then try again
    if (!newPerms.canAskAgain) {
      return {
        requireSettingsUpdate: true,
      };
    }

    return null;
  } catch (error) {
    console.warn('[getUserLocation] Error getting user location:', error);

    return null;
  }
}

/**
 * Try the instant OS-cached position first; only fire up the GPS
 * radio if there is nothing cached.
 */
async function fetchLocation(): Promise<LocationObject> {
  const lastKnown = await getLastKnownPositionAsync();
  if (lastKnown) return lastKnown;

  return await getCurrentPositionAsync({
    // Accuracy.Balanced is accurate to within one hundred meters.
    // Accuracy.High (within 10 meters) can take over 10 seconds sometimes.
    accuracy: Accuracy.Balanced,
  });
}

/**
 * Request a fresh GPS fix.  Useful for refining after an initial
 * last-known position has already been shown.
 */
export async function getFreshLocation(): Promise<LocationObject> {
  return await getCurrentPositionAsync({
    accuracy: Accuracy.Balanced,
  });
}
