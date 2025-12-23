import axios from 'axios';
import * as ExpoLocation from 'expo-location';
import { useEffect, useState } from 'react';
import { LocationDraft } from '../screens/NotesHmis/HmisProgramNoteForm';

const INITIAL_LOCATION = {
  longitude: -118.258815,
  latitude: 34.048655,
};

export function useInitialLocation(
  baseUrl: string,
  editing: boolean | undefined,
  location: LocationDraft | undefined,
  setValue: (name: 'location', value: LocationDraft) => void
) {
  const [userLocation, setUserLocation] =
    useState<ExpoLocation.LocationObject | null>(null);

  useEffect(() => {
    const autoSetInitialLocation = async () => {
      try {
        let { latitude, longitude } = INITIAL_LOCATION;

        const { status } =
          await ExpoLocation.requestForegroundPermissionsAsync();

        if (status === 'granted') {
          const userCurrentLocation =
            await ExpoLocation.getCurrentPositionAsync({
              accuracy: ExpoLocation.Accuracy.Balanced,
            });
          latitude = userCurrentLocation.coords.latitude;
          longitude = userCurrentLocation.coords.longitude;

          setUserLocation(userCurrentLocation);
        }

        if (editing) return;

        const url = `${baseUrl}/proxy/maps/api/geocode/json?latlng=${latitude},${longitude}`;
        const { data } = await axios.get(url, {
          params: { withCredentials: true },
        });

        const result = data.results?.[0];
        const formattedAddress: string | null =
          result?.formatted_address ?? null;
        const shortName: string | null = formattedAddress
          ? formattedAddress.split(', ')[0]
          : null;
        const components = result?.address_components ?? [];

        setValue('location', {
          ...location,
          longitude,
          latitude,
          formattedAddress,
          shortAddressName: shortName,
          components,
        } as LocationDraft);
      } catch (err) {
        console.error('Error auto-setting initial location', err);
      }
    };

    void autoSetInitialLocation();
  }, [baseUrl]);

  return [userLocation];
}
