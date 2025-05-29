import * as Location from 'expo-location';

export async function getUserLocation(): Promise<Location.LocationObjectCoords | null> {
  try {
    const { status } = await Location.requestForegroundPermissionsAsync();

    if (status !== 'granted') {
      return null;
    }

    const userCurrentLocation = await Location.getCurrentPositionAsync({
      // Accuracy.Balanced is accurate to within one hundred meters.
      // Accuracy.High (within 10 meters) can take over 10 seconds sometimes.
      // To use High may need to fetch Location progressively (from lower accuracy to highter).
      accuracy: Location.Accuracy.Balanced,
    });

    return userCurrentLocation.coords;
  } catch (error) {
    console.warn('[getUserLocation] Failed to get user location:', error);

    return null;
  }
}
