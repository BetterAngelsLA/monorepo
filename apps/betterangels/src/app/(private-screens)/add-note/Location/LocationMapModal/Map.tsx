import { LocationPinIcon } from '@monorepo/expo/shared/icons';
import axios from 'axios';
import * as Location from 'expo-location';
import { forwardRef } from 'react';
import { Platform } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';

interface IMapProps {
  currentLocation:
    | { longitude: number; latitude: number; name: string | undefined }
    | undefined;
  setCurrentLocation: (
    currentLocation:
      | { longitude: number; latitude: number; name: string | undefined }
      | undefined
  ) => void;
  pin: boolean;
  setInitialLocation: (initialLocation: {
    longitude: number;
    latitude: number;
  }) => void;
  initialLocation: { longitude: number; latitude: number };
  setPin: (pin: boolean) => void;
  setSelected: (selected: boolean) => void;
  setAddress: (
    address:
      | { full: string; short: string; addressComponents: any[] }
      | undefined
  ) => void;
  setChooseDirections: (chooseDirections: boolean) => void;
  chooseDirections: boolean;
  userLocation: Location.LocationObject | null;
}

const apiKey = process.env.EXPO_PUBLIC_GOOGLEMAPS_APIKEY;

const Map = forwardRef<MapView, IMapProps>((props: IMapProps, ref) => {
  const {
    currentLocation,
    setCurrentLocation,
    pin,
    setInitialLocation,
    initialLocation,
    setPin,
    setAddress,
    setSelected,
    setChooseDirections,
    chooseDirections,
    userLocation,
  } = props;

  async function placePin(e: any, isId: boolean) {
    if (chooseDirections) {
      setChooseDirections(false);
      return;
    }
    if (!pin) {
      const latitude = e.nativeEvent.coordinate.latitude;
      const longitude = e.nativeEvent.coordinate.longitude;
      const name =
        e.nativeEvent.name?.replace(/(\r\n|\n|\r)/gm, ' ') || undefined;
      const placeId = e.nativeEvent.placeId || undefined;
      const url = isId
        ? `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=formatted_address,address_components&key=${apiKey}`
        : `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${apiKey}`;
      try {
        const { data } = await axios.get(url);

        setCurrentLocation({
          longitude,
          latitude,
          name,
        });

        setInitialLocation({
          longitude,
          latitude,
        });

        const googleAddress = isId
          ? data.result.formatted_address
          : data.results[0].formatted_address;
        const addressComponents = isId
          ? data.result.address_components
          : data.results[0].address_components;

        const shortAddress = isId ? name : googleAddress.split(', ')[0];

        setAddress({
          short: shortAddress,
          full: googleAddress,
          addressComponents,
        });
        setPin(true);
        setSelected(true);
      } catch (err) {
        console.log(err);
      }
    } else {
      setAddress(undefined);
      setCurrentLocation(undefined);
      setPin(false);
      setSelected(false);
    }
  }

  return (
    <MapView
      ref={ref}
      showsUserLocation={userLocation ? true : false}
      showsMyLocationButton={false}
      mapType="standard"
      onPoiClick={(e) => console.log(e.nativeEvent.name)}
      zoomEnabled
      scrollEnabled
      onPress={(e) => placePin(e, false)}
      provider={Platform.OS === 'ios' ? undefined : PROVIDER_GOOGLE}
      initialRegion={{
        longitudeDelta: 0.005,
        latitudeDelta: 0.005,
        longitude: currentLocation
          ? currentLocation.longitude
          : userLocation
          ? userLocation.coords.longitude
          : initialLocation.longitude,
        latitude: currentLocation
          ? currentLocation.latitude
          : userLocation
          ? userLocation.coords.latitude
          : initialLocation.latitude,
      }}
      style={{
        height: '100%',
        width: '100%',
      }}
    >
      {currentLocation && (
        <Marker
          coordinate={{
            latitude: currentLocation.latitude,
            longitude: currentLocation?.longitude,
          }}
        >
          <LocationPinIcon size="2xl" />
        </Marker>
      )}
    </MapView>
  );
});

export default Map;
