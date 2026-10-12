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

    /**
     * Records a point, with its address when the geocoder can supply one.
     *
     * `reverseGeocode` throws on a real API failure rather than returning the
     * coordinates as if they were an address. That path still records the point —
     * it is the user's choice and the form requires a location — but it invents
     * no address: a denied key or an exhausted quota is not "there is no address
     * here", and `"34.04866, -118.25882"` would be saved as though it were one.
     * `reverseGeocode` still returns the coordinates for ZERO_RESULTS, which *is*
     * that case.
     *
     * The catch belongs here rather than around the caller because `onRefine`
     * fires it without awaiting, so a rejection would float.
     */
    const geocodeAndSet = async (latitude: number, longitude: number) => {
      const base = { ...locationRef.current, longitude, latitude };

      try {
        const geocodeResult = await places.reverseGeocode(latitude, longitude);

        setValueRef.current?.('location', {
          ...base,
          formattedAddress: geocodeResult.formattedAddress,
          shortAddressName: geocodeResult.shortAddress,
          components: geocodeResult.addressComponents,
        } as LocationDraft);
      } catch (err) {
        console.error(
          'Reverse geocode failed; recording the point without an address',
          err,
        );

        // Cleared explicitly: `base` carries the previous draft, whose address
        // describes a different point.
        setValueRef.current?.('location', {
          ...base,
          formattedAddress: undefined,
          shortAddressName: undefined,
          components: undefined,
        } as LocationDraft);
      }
    };

    const autoSetInitialLocation = async () => {
      try {
        const result = await getUserLocation({
          onRefine: (refined) => {
            setUserLocation(refined);
            if (!editingRef.current) {
              geocodeAndSet(refined.coords.latitude, refined.coords.longitude);
            }
          },
        });

        if (result?.location) {
          setUserLocation(result.location);
        }

        if (editingRef.current || defaultLocation) return;

        const coords = result?.location?.coords;

        await geocodeAndSet(
          coords?.latitude ?? INITIAL_LOCATION.latitude,
          coords?.longitude ?? INITIAL_LOCATION.longitude,
        );
      } catch (err) {
        console.error('Error auto-setting initial location', err);
      }
    };

    void autoSetInitialLocation();
  }, [places, defaultLocation]);

  return [userLocation];
}
