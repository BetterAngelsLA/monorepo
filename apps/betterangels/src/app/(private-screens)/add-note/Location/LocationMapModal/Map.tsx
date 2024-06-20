import { LocationPinIcon } from '@monorepo/expo/shared/icons';
import axios from 'axios';
import * as Location from 'expo-location';
import { forwardRef } from 'react';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
// DEV-445 - Implement Import Aliases to Replace Long Relative Paths
import { apiUrl } from '../../../../../../config';

interface IMapProps {
  currentLocation:
    | { longitude: number; latitude: number; name: string | undefined }
    | undefined;
  setCurrentLocation: (
    currentLocation:
      | { longitude: number; latitude: number; name: string | undefined }
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
    setInitialLocation,
    initialLocation,
    setMinimizeModal,
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
    const latitude = e.nativeEvent.coordinate.latitude;
    const longitude = e.nativeEvent.coordinate.longitude;
    const name =
      e.nativeEvent.name?.replace(/(\r\n|\n|\r)/gm, ' ') || undefined;
    const placeId = e.nativeEvent.placeId || undefined;
    const url = isId
      ? `${apiUrl}/proxy/maps/api/place/details/json?place_id=${placeId}&fields=formatted_address,address_components&key=${apiKey}`
      : `${apiUrl}/proxy/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${apiKey}`;
    try {
      // TODO: DEV-446 - Transition to react-native-google-places-autocomplete
      const { data } = await axios.get(url, {
        params: {
          withCredentials: true,
        },
      });

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
      setMinimizeModal(false);
      setSelected(true);
    } catch (err) {
      console.log(err);
    }
  }

  return (
    <MapView
      ref={ref}
      showsUserLocation={userLocation ? true : false}
      showsMyLocationButton={false}
      mapType="standard"
      onPoiClick={(e) => placePin(e, true)}
      zoomEnabled
      scrollEnabled
      onPress={(e) => placePin(e, false)}
      onPanDrag={() => {
        setMinimizeModal(true);
      }}
      onDoublePress={() => setMinimizeModal(true)}
      provider={PROVIDER_GOOGLE}
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
