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
import React, { forwardRef } from 'react';
import type { MapPressEvent, PoiClickEvent } from 'react-native-maps';

interface IMapProps {
  currentLocation?:
    | { longitude: number; latitude: number; name?: string }
    | undefined;
  setCurrentLocation: (
    currentLocation?:
      | { longitude: number; latitude: number; name?: string }
      | undefined
  ) => void;
  setInitialLocation: (initialLocation: {
    longitude: number;
    latitude: number;
  }) => void;
  initialLocation: { longitude: number; latitude: number };
  setMinimizeModal: (minimizeModal: boolean) => void;
  setSelected: (selected: boolean) => void;
  setAddress: (
    address?:
      | { full: string; short: string; addressComponents: any[] }
      | undefined
  ) => void;
  setChooseDirections: (chooseDirections: boolean) => void;
  chooseDirections: boolean;
  userLocation: Location.LocationObject | null;
}

const apiKey = process.env.EXPO_PUBLIC_GOOGLEMAPS_APIKEY;

const Map = forwardRef<TMapView, IMapProps>((props: IMapProps, ref) => {
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

  async function placePin(e: MapPressEvent | PoiClickEvent, isId: boolean) {
    if (chooseDirections) {
      setChooseDirections(false);
      return;
    }

    const { latitude, longitude } = e.nativeEvent.coordinate;
    const rawName = 'name' in e.nativeEvent ? e.nativeEvent.name : undefined;
    const placeId =
      'placeId' in e.nativeEvent ? e.nativeEvent.placeId : undefined;
    const name = rawName?.replace(/(\r\n|\n|\r)/gm, ' ') || undefined;

    setCurrentLocation({ longitude, latitude, name });
    setInitialLocation({ longitude, latitude });
    setMinimizeModal(false);
    setSelected(true);

    const url = isId
      ? `${baseUrl}/proxy/maps/api/place/details/json?place_id=${encodeURIComponent(
          placeId ?? ''
        )}&fields=formatted_address,address_components&key=${apiKey}`
      : `${baseUrl}/proxy/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${apiKey}`;

    try {
      const { data } = await axios.get(url, {
        withCredentials: true,
        timeout: 8000,
      });

      const result = isId ? data?.result : data?.results?.[0];
      const googleAddress: string | undefined = result?.formatted_address;
      const addressComponents: any[] | undefined = result?.address_components;

      if (!googleAddress || !addressComponents) {
        setAddress({
          short: name || `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`,
          full: name || `${latitude}, ${longitude}`,
          addressComponents: [],
        });
        return;
      }

      const shortAddress = isId && name ? name : googleAddress.split(', ')[0];

      setAddress({
        short: shortAddress,
        full: googleAddress,
        addressComponents,
      });
    } catch (err) {
      setAddress({
        short: name || `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`,
        full: name || `${latitude}, ${longitude}`,
        addressComponents: [],
      });
      console.error('Reverse geocode failed:', err);
    }
  }

  const initialRegion = {
    longitudeDelta: 0.005,
    latitudeDelta: 0.005,
    longitude:
      currentLocation?.longitude ??
      userLocation?.coords.longitude ??
      initialLocation.longitude,
    latitude:
      currentLocation?.latitude ??
      userLocation?.coords.latitude ??
      initialLocation.latitude,
  };

  return (
    <MapView
      ref={ref}
      showsUserLocation={!!userLocation}
      showsMyLocationButton={false}
      mapType="standard"
      onPoiClick={(e) => placePin(e, true)}
      zoomEnabled
      scrollEnabled
      onPress={(e) => placePin(e, false)}
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
