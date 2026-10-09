import {
  getUserLocation,
  useGooglePlaces,
} from '@monorepo/expo/shared/ui-components';
import { LocationObject } from 'expo-location';
import { useEffect, useRef, useState } from 'react';
import { LocationDraft } from '../screens/NotesHmis/NoteFormHmis';
import { useUserDefaultNoteLocation } from '../state/userPreferencesState/hooks/useUserDefaultNoteLocation';

const INITIAL_LOCATION = {
  longitude: -118.258815,
  latitude: 34.048655,
};

export function useInitialLocation(
  editing: boolean | undefined,
  location: LocationDraft | undefined,
  setValue?: (name: 'location', value: LocationDraft) => void,
) {
  const places = useGooglePlaces();
  const [userLocation, setUserLocation] = useState<LocationObject | null>(null);
  const [defaultLocation] = useUserDefaultNoteLocation();

  const editingRef = useRef(editing);
  editingRef.current = editing;
  const locationRef = useRef(location);
  locationRef.current = location;
  const setValueRef = useRef(setValue);
  setValueRef.current = setValue;

  useEffect(() => {
    if (
      defaultLocation &&
      defaultLocation.latitude &&
      defaultLocation.longitude
    ) {
      setValueRef.current?.('location', {
        ...locationRef.current,
        longitude: defaultLocation.longitude,
        latitude: defaultLocation.latitude,
        formattedAddress: defaultLocation.formattedAddress,
        shortAddressName: defaultLocation.shortAddressName,
        components: defaultLocation.components,
      } as LocationDraft);
    }

    const geocodeAndSet = async (loc: LocationObject) => {
      const { latitude, longitude } = loc.coords;

      // `reverseGeocode` throws on a real API failure now, rather than returning
      // the coordinates as if they were an address. Fall back to them here as
      // before, and inside the helper: `onRefine` fires this without awaiting, so
      // a rejection would escape the caller's try and float.
      let geocodeResult: Awaited<ReturnType<typeof places.reverseGeocode>>;

      try {
        geocodeResult = await places.reverseGeocode(latitude, longitude);
      } catch (err) {
        console.error(
          'Reverse geocode failed; falling back to coordinates',
          err,
        );

        const fallback = `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`;
        geocodeResult = {
          formattedAddress: fallback,
          shortAddress: fallback,
          addressComponents: [],
        };
      }

      setValueRef.current?.('location', {
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

        if (editingRef.current || defaultLocation) return;

        if (result?.location) {
          await geocodeAndSet(result.location);
        } else {
          const geocodeResult = await places.reverseGeocode(
            INITIAL_LOCATION.latitude,
            INITIAL_LOCATION.longitude,
          );
          setValueRef.current?.('location', {
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
  }, [places, defaultLocation]);

  return [userLocation];
}
