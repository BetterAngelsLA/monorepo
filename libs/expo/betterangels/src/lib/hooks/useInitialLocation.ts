import {
  getUserLocation,
  useGooglePlaces,
} from '@monorepo/expo/shared/ui-components';
import { LocationObject } from 'expo-location';
import { useEffect, useRef, useState } from 'react';
import { LocationDraft } from '../screens/NotesHmis/HmisProgramNoteForm';

const INITIAL_LOCATION = {
  longitude: -118.258815,
  latitude: 34.048655,
};

export function useInitialLocation(
  editing: boolean | undefined,
  location: LocationDraft | undefined,
  setValue: (name: 'location', value: LocationDraft) => void
) {
  const places = useGooglePlaces();
  const [userLocation, setUserLocation] = useState<LocationObject | null>(null);

  const editingRef = useRef(editing);
  editingRef.current = editing;
  const locationRef = useRef(location);
  locationRef.current = location;
  const setValueRef = useRef(setValue);
  setValueRef.current = setValue;

  useEffect(() => {
    const geocodeAndSet = async (loc: LocationObject) => {
      const { latitude, longitude } = loc.coords;
      const geocodeResult = await places.reverseGeocode(latitude, longitude);

      setValueRef.current('location', {
        ...locationRef.current,
        longitude,
        latitude,
        formattedAddress: geocodeResult.formattedAddress,
        shortAddressName: geocodeResult.shortAddress,
        components: geocodeResult.addressComponents,
      } as LocationDraft);
    };

    const autoSetInitialLocation = async () => {
      try {
        const result = await getUserLocation({
          onRefine: (refined) => {
            setUserLocation(refined);
            if (!editingRef.current) {
              geocodeAndSet(refined);
            }
          },
        });

        if (result?.location) {
          setUserLocation(result.location);
        }

        if (editingRef.current) return;

        if (result?.location) {
          await geocodeAndSet(result.location);
        } else {
          const geocodeResult = await places.reverseGeocode(
            INITIAL_LOCATION.latitude,
            INITIAL_LOCATION.longitude
          );
          setValueRef.current('location', {
            ...locationRef.current,
            longitude: INITIAL_LOCATION.longitude,
            latitude: INITIAL_LOCATION.latitude,
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
