import { useApiConfig } from '@monorepo/expo/shared/clients';
import { LocationPinIcon } from '@monorepo/expo/shared/icons';
import * as Location from 'expo-location';
import { forwardRef } from 'react';
import { MapView, Marker, PROVIDER_GOOGLE, TMapView } from '../../../../maps';
import { getPlaceDetailsById, reverseGeocode } from '../../../../services';

interface IMapProps {
  currentLocation:
    | {
        longitude: number;
        latitude: number;
        shortAddressName: string | undefined;
      }
    | undefined;
  setCurrentLocation: (
    currentLocation:
      | {
          longitude: number;
          latitude: number;
          shortAddressName: string | undefined;
        }
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

  async function placePin(e: any, isId: boolean) {
    if (chooseDirections) {
      setChooseDirections(false);
      return;
    }
    const latitude = e.nativeEvent.coordinate.latitude;
    const longitude = e.nativeEvent.coordinate.longitude;
    const shortAddressName =
      e.nativeEvent.name?.replace(/(\r\n|\n|\r)/gm, ' ') || undefined;
    const placeId = e.nativeEvent.placeId || undefined;

    setCurrentLocation({ longitude, latitude, shortAddressName });
    setInitialLocation({ longitude, latitude });
    setMinimizeModal(false);
    setSelected(true);

    try {
      if (isId && placeId) {
        const placeResult = await getPlaceDetailsById({ baseUrl, placeId });
        const googleAddress = placeResult.formatted_address || '';

        setAddress({
          short: shortAddressName || googleAddress.split(', ')[0],
          full: googleAddress,
          addressComponents: placeResult.address_components || [],
        });
      } else {
        const geocodeResult = await reverseGeocode({
          baseUrl,
          latitude,
          longitude,
        });

        setAddress({
          short: geocodeResult.shortAddress,
          full: geocodeResult.formattedAddress,
          addressComponents: geocodeResult.addressComponents,
        });
      }
    } catch (err) {
      console.error('Geocode failed:', err);
      setAddress({
        short:
          shortAddressName || `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`,
        full: shortAddressName || `${latitude}, ${longitude}`,
        addressComponents: [],
      });
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
      userInterfaceStyle="light"
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
