import {
  getFreshLocation,
  getUserLocation,
  useGooglePlaces,
} from '@monorepo/expo/shared/ui-components';
import { LocationObject } from 'expo-location';
import haversine from 'haversine-distance';
import { useEffect, useRef, useState } from 'react';
import { LocationDraft } from '../screens/NotesHmis/HmisProgramNoteForm';

const INITIAL_LOCATION = {
  longitude: -118.258815,
  latitude: 34.048655,
};

const REFINE_THRESHOLD_METRES = 50;

export function useInitialLocation(
  editing: boolean | undefined,
  location: LocationDraft | undefined,
  setValue: (name: 'location', value: LocationDraft) => void
) {
  const places = useGooglePlaces();
  const [userLocation, setUserLocation] = useState<LocationObject | null>(null);

  // Use refs to avoid re-running the effect when these change
  const editingRef = useRef(editing);
  editingRef.current = editing;
  const locationRef = useRef(location);
  locationRef.current = location;
  const setValueRef = useRef(setValue);
  setValueRef.current = setValue;

  useEffect(() => {
    const autoSetInitialLocation = async () => {
      try {
        // 1. Get location (last-known first, then GPS)
        const result = await getUserLocation();
        const initialCoords = result?.location?.coords;

        if (result?.location) {
          setUserLocation(result.location);
        }

        if (editingRef.current) return;

        let lat = INITIAL_LOCATION.latitude;
        let lng = INITIAL_LOCATION.longitude;

        if (initialCoords) {
          lat = initialCoords.latitude;
          lng = initialCoords.longitude;
        }

        const geocodeResult = await places.reverseGeocode(lat, lng);

        setValueRef.current('location', {
          ...locationRef.current,
          longitude: lng,
          latitude: lat,
          formattedAddress: geocodeResult.formattedAddress,
          shortAddressName: geocodeResult.shortAddress,
          components: geocodeResult.addressComponents,
        } as LocationDraft);

        // 2. Refine with fresh GPS if significantly different
        if (initialCoords) {
          try {
            const fresh = await getFreshLocation();
            setUserLocation(fresh);

            if (
              !editingRef.current &&
              haversine(initialCoords, fresh.coords) > REFINE_THRESHOLD_METRES
            ) {
              const freshGeocode = await places.reverseGeocode(
                fresh.coords.latitude,
                fresh.coords.longitude
              );
              setValueRef.current('location', {
                ...locationRef.current,
                longitude: fresh.coords.longitude,
                latitude: fresh.coords.latitude,
                formattedAddress: freshGeocode.formattedAddress,
                shortAddressName: freshGeocode.shortAddress,
                components: freshGeocode.addressComponents,
              } as LocationDraft);
            }
          } catch {
            // Fresh GPS unavailable — keep the initial position
          }
        }
      } catch (err) {
        console.error('Error auto-setting initial location', err);
      }
    };

    void autoSetInitialLocation();
  }, [places]);

  return [userLocation];
}
