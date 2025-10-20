import {
  MapView,
  Marker,
  PROVIDER_GOOGLE,
  TMapView,
} from '@monorepo/expo/betterangels';
import { useApiConfig } from '@monorepo/expo/shared/clients';
import { LocationPinIcon } from '@monorepo/expo/shared/icons';
import axios from 'axios';
import * as Location from 'expo-location';
import React, {
  forwardRef,
  useCallback,
  useMemo,
  type Dispatch,
  type SetStateAction,
} from 'react';
import type { MapPressEvent, PoiClickEvent } from 'react-native-maps';

type GoogleAddressComponent = {
  long_name: string;
  short_name: string;
  types: string[];
};

type PlaceDetailsResponse = {
  result?: {
    formatted_address?: string;
    address_components?: GoogleAddressComponent[];
  };
};

type GeocodeResponse = {
  results?: Array<{
    formatted_address?: string;
    address_components?: GoogleAddressComponent[];
  }>;
};

type LatLngName = {
  longitude: number;
  latitude: number;
  name: string | undefined;
};

type Address = {
  full: string;
  short: string;
  addressComponents: GoogleAddressComponent[];
};

interface IMapProps {
  currentLocation?: LatLngName;
  setCurrentLocation: Dispatch<SetStateAction<LatLngName | undefined>>;
  setInitialLocation: (v: { longitude: number; latitude: number }) => void;
  initialLocation: { longitude: number; latitude: number };
  setMinimizeModal: (v: boolean) => void;
  setSelected: (v: boolean) => void;
  setAddress: (v?: Address) => void;
  setChooseDirections: (v: boolean) => void;
  chooseDirections: boolean;
  userLocation: Location.LocationObject | null;
}

const apiKey = process.env.EXPO_PUBLIC_GOOGLEMAPS_APIKEY;
const DELTA = 0.005;

const Map = forwardRef<TMapView, IMapProps>((props, ref) => {
  const {
    currentLocation,
    setCurrentLocation,
    setInitialLocation,
    initialLocation,
    setMinimizeModal,
    setAddress,
    setSelected,
    setChooseDirections,
    chooseDirections,
    userLocation,
  } = props;

  const { baseUrl } = useApiConfig();

  const initialRegion = useMemo(() => {
    const longitude =
      currentLocation?.longitude ??
      userLocation?.coords.longitude ??
      initialLocation.longitude;

    const latitude =
      currentLocation?.latitude ??
      userLocation?.coords.latitude ??
      initialLocation.latitude;

    return { longitudeDelta: DELTA, latitudeDelta: DELTA, longitude, latitude };
  }, [currentLocation, userLocation, initialLocation]);

  const placePinFromEvent = useCallback(
    async (e: MapPressEvent | PoiClickEvent, isId: boolean) => {
      if (chooseDirections) {
        setChooseDirections(false);
        return;
      }

      const { latitude, longitude } = e.nativeEvent.coordinate;
      const rawName = 'name' in e.nativeEvent ? e.nativeEvent.name : undefined;
      const placeId =
        'placeId' in e.nativeEvent ? e.nativeEvent.placeId : undefined;
      const name = rawName ? rawName.replace(/(\r\n|\n|\r)/gm, ' ') : undefined;

      // Pre-fetch UI updates
      setCurrentLocation({ longitude, latitude, name });
      setInitialLocation({ longitude, latitude });
      setMinimizeModal(false);
      setSelected(true);

      try {
        const url = isId
          ? `${baseUrl}/proxy/maps/api/place/details/json?place_id=${encodeURIComponent(
              placeId ?? ''
            )}&fields=formatted_address,address_components&key=${apiKey}`
          : `${baseUrl}/proxy/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${apiKey}`;

        const { data } = await axios.get<
          PlaceDetailsResponse | GeocodeResponse
        >(url, {
          withCredentials: true,
          timeout: 8000,
        });

        const result = isId
          ? (data as PlaceDetailsResponse).result
          : (data as GeocodeResponse).results?.[0];

        const full = result?.formatted_address;
        const comps = result?.address_components;

        if (!full || !comps) {
          setAddress({
            short: name || `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`,
            full: name || `${latitude}, ${longitude}`,
            addressComponents: [],
          });
        } else {
          const baseShort = full.split(', ')[0];
          const short = isId && name ? name : baseShort;
          setAddress({ short, full, addressComponents: comps });
        }
      } catch (err: unknown) {
        setAddress({
          short: name || `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`,
          full: name || `${latitude}, ${longitude}`,
          addressComponents: [],
        });
        console.error('Reverse geocode failed:', err);
      }
    },
    [
      baseUrl,
      chooseDirections,
      setChooseDirections,
      setCurrentLocation,
      setInitialLocation,
      setMinimizeModal,
      setSelected,
      setAddress,
    ]
  );

  return (
    <MapView
      ref={ref}
      showsUserLocation={!!userLocation}
      showsMyLocationButton={false}
      mapType="standard"
      onPoiClick={(e) => placePinFromEvent(e, true)}
      zoomEnabled
      scrollEnabled
      onPress={(e) => placePinFromEvent(e, false)}
      onPanDrag={() => setMinimizeModal(true)}
      onDoublePress={() => setMinimizeModal(true)}
      provider={PROVIDER_GOOGLE}
      initialRegion={initialRegion}
      style={{ height: '100%', width: '100%' }}
      userInterfaceStyle="light"
    >
      {currentLocation && (
        <Marker
          coordinate={{
            latitude: currentLocation.latitude,
            longitude: currentLocation.longitude,
          }}
        >
          <LocationPinIcon size="2xl" />
        </Marker>
      )}
    </MapView>
  );
});

export default Map;
