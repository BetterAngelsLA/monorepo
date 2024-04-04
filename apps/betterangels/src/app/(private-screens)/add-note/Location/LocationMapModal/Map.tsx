import { LocationPinIcon } from '@monorepo/expo/shared/icons';
import axios from 'axios';
import * as Location from 'expo-location';
import { forwardRef } from 'react';
import { useFormContext } from 'react-hook-form';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';

interface IMapProps {
  currentLocation:
    | { longitude: number; latitude: number; name: string | undefined }
    | undefined;
  setCurrentLocation: (
    e:
      | { longitude: number; latitude: number; name: string | undefined }
      | undefined
  ) => void;
  pin: boolean;
  setInitialLocation: (e: { longitude: number; latitude: number }) => void;
  initialLocation: { longitude: number; latitude: number };
  setPin: (e: boolean) => void;
  setSelected: (e: boolean) => void;
  setAddress: (e: { full: string; short: string } | undefined) => void;
  setChooseDirections: (e: boolean) => void;
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
  const { watch, setValue } = useFormContext();

  const location = watch('location');

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
        ? `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=formatted_address&key=${apiKey}`
        : `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${apiKey}`;
      try {
        const { data } = await axios.get(url);
        setValue('location', undefined);
        console.log(
          'GEOCODE RESULTS GEOCODE RESULTS GEOCODE RESULTS GEOCODE RESULTS '
        );
        console.log(data.results[0]);
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
        const shortAddress = isId ? name : googleAddress.split(', ')[0];

        setAddress({
          short: shortAddress,
          full: googleAddress,
        });
        setPin(true);
        setSelected(true);
        console.log(
          'GEOCODE RESULTS GEOCODE RESULTS GEOCODE RESULTS GEOCODE RESULTS '
        );
        console.log(data.results[0]);
      } catch (e) {
        console.log(e);
      }
    } else {
      setAddress(undefined);
      setCurrentLocation(undefined);
      setPin(false);
      setSelected(false);
      setValue('location', undefined);
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
      {(currentLocation || (location && location.address)) && (
        <Marker
          coordinate={{
            latitude: location ? location.latitude : currentLocation?.latitude,
            longitude: location
              ? location.longitude
              : currentLocation?.longitude,
          }}
        >
          <LocationPinIcon size="2xl" />
        </Marker>
      )}
    </MapView>
  );
});

export default Map;
