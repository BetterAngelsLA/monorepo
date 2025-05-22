import * as Location from 'expo-location';
import { useEffect, useState } from 'react';

export function useUserLocation() {
  const [userLocation, setUserLocation] =
    useState<Location.LocationObject | null>(null);
  const getLocation = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      return;
    }
    const userCurrentLocation = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });

    setUserLocation(userCurrentLocation);
  };

  useEffect(() => {
    getLocation();
  }, []);

  return userLocation;
}
