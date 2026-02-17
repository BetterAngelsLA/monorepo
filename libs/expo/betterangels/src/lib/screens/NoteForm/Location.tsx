import { LocationPinIcon } from '@monorepo/expo/shared/icons';
import { Colors, Spacings } from '@monorepo/expo/shared/static';
import {
  FieldCard,
  TextMedium,
  usePlacesClient,
} from '@monorepo/expo/shared/ui-components';
import * as ExpoLocation from 'expo-location';
import { RefObject, useEffect, useRef, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { LocationInput } from '../../apollo';
import { MapView, Marker, PROVIDER_GOOGLE } from '../../maps';
import { useModalScreen } from '../../providers';
import { LocationMapModal, TLocationData } from '../../ui-components';

const FIELD_KEY = 'Location';

const INITIAL_LOCATION = {
  longitude: -118.258815,
  latitude: 34.048655,
};

interface ILocationProps {
  scrollRef: RefObject<ScrollView | null>;
  expanded: string | undefined | null;
  errors: {
    location: boolean;
    purpose: boolean;
    date: boolean;
    time: boolean;
  };
  setErrors: (errors: {
    location: boolean;
    purpose: boolean;
    date: boolean;
    time: boolean;
  }) => void;
  setExpanded: (expanded: string | undefined | null) => void;
  noteId: string;
  point?: number[] | null;
  address?:
    | {
        __typename?: 'AddressType' | undefined;
        street?: string | null | undefined;
        city?: string | null | undefined;
        state?: string | null | undefined;
        zipCode?: string | null | undefined;
      }
    | null
    | undefined;
  onLocationChange: (location: LocationInput) => void;
}

type TLocation =
  | {
      address: string | null | undefined;
      latitude: number | null | undefined;
      longitude: number | null | undefined;
      name: string | null | undefined;
    }
  | undefined;

export default function LocationComponent(props: ILocationProps) {
  const {
    expanded,
    setExpanded,
    noteId,
    address,
    point,
    scrollRef,
    errors,
    setErrors,
    onLocationChange,
  } = props;

  const places = usePlacesClient();

  const [location, setLocation] = useState<TLocation>({
    latitude: point ? point[1] : null,
    longitude: point ? point[0] : null,
    address: address
      ? `${address.street}, ${address.city}, ${address.state} ${address.zipCode}`
      : null,
    name: address && address.street ? address.street : null,
  });

  const locationRef = useRef<TLocation>(location);
  const autoFilledRef = useRef(false);

  // Sync server data into local state when props arrive (e.g. after async query)
  useEffect(() => {
    if (point && point.length === 2 && !location?.latitude) {
      const formatted = address
        ? `${address.street}, ${address.city}, ${address.state} ${address.zipCode}`
        : null;
      setLocation({
        latitude: point[1],
        longitude: point[0],
        address: formatted,
        name: address?.street ?? null,
      });
    }
  }, [point, address]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    locationRef.current = location;
  }, [location]);

  const isLocation = expanded === FIELD_KEY;

  const { showModalScreen } = useModalScreen();

  const handleSelectLocation = async (data: TLocationData) => {
    const newLocation: TLocation = {
      latitude: data.latitude,
      longitude: data.longitude,
      address: data.address,
      name: data.name,
    };

    setLocation(newLocation);

    onLocationChange({
      point: [data.longitude, data.latitude],
      address: data.address
        ? {
            formattedAddress: data.address,
            addressComponents: JSON.stringify(data.addressComponents ?? []),
          }
        : undefined,
    });
  };

  // Auto-prefill on NEW notes: no point/address → use current or default location
  useEffect(() => {
    const hasServerLocation = !!point && point.length === 2;
    const hasLocalLocation = !!location?.latitude && !!location?.longitude;

    if (hasServerLocation || hasLocalLocation || autoFilledRef.current) {
      return;
    }

    autoFilledRef.current = true;

    const autoSetInitialLocation = async () => {
      try {
        let latitude = INITIAL_LOCATION.latitude;
        let longitude = INITIAL_LOCATION.longitude;

        const { status } =
          await ExpoLocation.requestForegroundPermissionsAsync();

        if (status === 'granted') {
          const userCurrentLocation =
            await ExpoLocation.getCurrentPositionAsync({
              accuracy: ExpoLocation.Accuracy.Balanced,
            });
          latitude = userCurrentLocation.coords.latitude;
          longitude = userCurrentLocation.coords.longitude;
        }

        const geocodeResult = await places.reverseGeocode(latitude, longitude);

        const newLocation: TLocation = {
          latitude,
          longitude,
          address: geocodeResult.formattedAddress,
          name: geocodeResult.shortAddress,
        };

        setLocation(newLocation);

        onLocationChange({
          point: [longitude, latitude],
          address: geocodeResult.formattedAddress
            ? {
                formattedAddress: geocodeResult.formattedAddress,
                addressComponents: JSON.stringify(
                  geocodeResult.addressComponents ?? []
                ),
              }
            : undefined,
        });
      } catch (err) {
        console.error('Error auto-setting initial location', err);
      }
    };

    void autoSetInitialLocation();
  }, [point, address, places, noteId, onLocationChange, location]);

  return (
    <FieldCard
      scrollRef={scrollRef}
      required
      expanded={expanded}
      mb="xs"
      error={errors.location ? 'Please enter a location' : undefined}
      setExpanded={() => {
        setExpanded(isLocation ? undefined : FIELD_KEY);

        showModalScreen({
          presentation: 'modal',
          title: 'Type or Pin Location',
          onClose: () => {
            setErrors({
              ...errors,
              location: !locationRef.current,
            });
          },
          renderContent: ({ close }) => (
            <LocationMapModal
              initialLocation={
                location
                  ? {
                      latitude: location.latitude ?? 0,
                      longitude: location.longitude ?? 0,
                      name: location.name ?? undefined,
                      address: location.address ?? undefined,
                    }
                  : undefined
              }
              onSelectLocation={handleSelectLocation}
              onClose={close}
            />
          ),
        });
      }}
      title="Location "
      actionName={
        (!location || (location && !location.address)) && !isLocation ? (
          <TextMedium size="sm">Add Location</TextMedium>
        ) : (
          <TextMedium size="sm">
            {location && location.latitude
              ? location?.name
                ? location.name
                : location.address?.split(', ')[0]
              : 'Add Location'}
          </TextMedium>
        )
      }
    >
      {location && location.longitude && location.latitude && (
        <View style={{ paddingBottom: Spacings.md }}>
          <MapView
            zoomEnabled={false}
            scrollEnabled={false}
            provider={PROVIDER_GOOGLE}
            region={{
              longitudeDelta: 0.005,
              latitudeDelta: 0.005,
              latitude: location.latitude,
              longitude: location.longitude,
            }}
            userInterfaceStyle="light"
            style={styles.map}
          >
            <Marker
              coordinate={{
                latitude: location.latitude,
                longitude: location.longitude,
              }}
            >
              <LocationPinIcon size="2xl" />
            </Marker>
          </MapView>
        </View>
      )}
    </FieldCard>
  );
}

const styles = StyleSheet.create({
  map: {
    width: '100%',
    height: 120,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.NEUTRAL_LIGHT,
  },
});
