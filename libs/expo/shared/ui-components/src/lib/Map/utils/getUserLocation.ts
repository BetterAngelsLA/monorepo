import {
  Accuracy,
  LocationObject,
  PermissionStatus,
  getCurrentPositionAsync,
  requestForegroundPermissionsAsync,
} from 'expo-location';

type TResponse = {
  permissionStatus?: PermissionStatus;
  location?: LocationObject;
};

export async function getUserLocation(): Promise<TResponse> {
  try {
    const { status } = await requestForegroundPermissionsAsync();

    if (status !== PermissionStatus.GRANTED) {
      return {
        permissionStatus: status,
      };
    }

    const userCurrentLocation = await getCurrentPositionAsync({
      // Accuracy.Balanced is accurate to within one hundred meters.
      // Accuracy.High (within 10 meters) can take over 10 seconds sometimes.
      // To use High may need to fetch Location progressively (from lower accuracy to highter).
      accuracy: Accuracy.Balanced,
    });

    return {
      permissionStatus: status,
      location: userCurrentLocation,
    };
  } catch (error) {
    console.warn('[getUserLocation] Failed to get user location:', error);

    return {};
  }
}
