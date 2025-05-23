import * as Location from 'expo-location';

export async function getUserLocation(): Promise<Location.LocationObjectCoords | null> {
  try {
    const { status } = await Location.requestForegroundPermissionsAsync();

    if (status !== 'granted') {
      return null;
    }

    const userCurrentLocation = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.High,
    });

    return userCurrentLocation.coords;
  } catch (error) {
    console.warn('[getUserLocation] Failed to get user location:', error);

    return null;
  }
}
