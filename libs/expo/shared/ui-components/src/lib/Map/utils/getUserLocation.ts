import {
  Accuracy,
  LocationObject,
  getCurrentPositionAsync,
  getForegroundPermissionsAsync,
  requestForegroundPermissionsAsync,
} from 'expo-location';

type TResponse = {
  location?: LocationObject;
  requireSettingsUpdate?: true;
};

export async function getUserLocation(): Promise<TResponse | null> {
  try {
    const existingPerms = await getForegroundPermissionsAsync();

    // if permission already granted, fetch location and return
    if (existingPerms.granted) {
      const userCurrentLocation = await fetchCurrentLocation();

      return {
        location: userCurrentLocation,
      };
    }

    // permission not granted, so let's request permission from user
    const newPerms = await requestForegroundPermissionsAsync();

    // if permission now granted, fetch location and return
    if (newPerms.granted) {
      const userCurrentLocation = await fetchCurrentLocation();

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

async function fetchCurrentLocation() {
  return await getCurrentPositionAsync({
    // Accuracy.Balanced is accurate to within one hundred meters.
    // Accuracy.High (within 10 meters) can take over 10 seconds sometimes.
    // To use High may need to fetch Location progressively (from lower accuracy to highter).
    accuracy: Accuracy.Balanced,
  });
}
