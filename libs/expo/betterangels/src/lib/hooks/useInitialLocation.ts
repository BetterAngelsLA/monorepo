import { usePlacesClient } from '@monorepo/expo/shared/ui-components';
import * as ExpoLocation from 'expo-location';
import { useEffect, useState } from 'react';
import { LocationDraft } from '../screens/NotesHmis/HmisProgramNoteForm';
import { useUserDefaultNoteLocation } from '../state/userPreferencesState/hooks/useUserDefaultNoteLocation';

const INITIAL_LOCATION = {
  longitude: -118.258815,
  latitude: 34.048655,
};

export function useInitialLocation(
  editing: boolean | undefined,
  location: LocationDraft | undefined,
  setValue?: (name: 'location', value: LocationDraft) => void
) {
  const places = usePlacesClient();
  const [userLocation, setUserLocation] =
    useState<ExpoLocation.LocationObject | null>(null);
  const [defaultLocation] = useUserDefaultNoteLocation();

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

          if (!defaultLocation) {
            latitude = userCurrentLocation.coords.latitude;
            longitude = userCurrentLocation.coords.longitude;
          }

          setUserLocation(userCurrentLocation);
        }

        if (
          defaultLocation &&
          defaultLocation.latitude &&
          defaultLocation.longitude
        ) {
          latitude = defaultLocation.latitude;
          longitude = defaultLocation.longitude;
        }

        if (editing) return;

        const geocodeResult = await places.reverseGeocode(latitude, longitude);

        if (setValue) {
          setValue('location', {
            ...location,
            longitude,
            latitude,
            formattedAddress: geocodeResult.formattedAddress,
            shortAddressName: geocodeResult.shortAddress,
            components: geocodeResult.addressComponents,
          } as LocationDraft);
        }
      } catch (err) {
        console.error('Error auto-setting initial location', err);
      }
    };

    void autoSetInitialLocation();
  }, [places]);

  return [userLocation];
}
