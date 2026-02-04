import { useMutation } from '@apollo/client/react';
import {
  MapView,
  Marker,
  PROVIDER_GOOGLE,
  reverseGeocode,
  UpdateNoteLocationDocument,
  useModalScreen,
} from '@monorepo/expo/betterangels';
import { useApiConfig } from '@monorepo/expo/shared/clients';
import { LocationPinIcon } from '@monorepo/expo/shared/icons';
import { Colors, Spacings } from '@monorepo/expo/shared/static';
import { FieldCard, TextMedium } from '@monorepo/expo/shared/ui-components';
import * as ExpoLocation from 'expo-location';
import { RefObject, useEffect, useRef, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import LocationMapModal from './LocationMapModal';

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
  } = props;

  const { baseUrl } = useApiConfig();
  const [updateNoteLocation] = useMutation(UpdateNoteLocationDocument);

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

  useEffect(() => {
    locationRef.current = location;
  }, [location]);

  const isLocation = expanded === FIELD_KEY;

  const { showModalScreen } = useModalScreen();

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

        const geocodeResult = await reverseGeocode({
          baseUrl,
          latitude,
          longitude,
        });

        const newLocation: TLocation = {
          latitude,
          longitude,
          address: geocodeResult.formattedAddress,
          name: geocodeResult.shortAddress,
        };

        setLocation(newLocation);

        await updateNoteLocation({
          variables: {
            data: {
              id: noteId,
              location: {
                point: [longitude, latitude],
                address: geocodeResult.formattedAddress
                  ? {
                      formattedAddress: geocodeResult.formattedAddress,
                      addressComponents: JSON.stringify(
                        geocodeResult.addressComponents
                      ),
                    }
                  : null,
              },
            },
          },
        });
      } catch (err) {
        console.error('Error auto-setting initial location', err);
      }
    };

    void autoSetInitialLocation();
  }, [point, address, baseUrl, noteId, updateNoteLocation, location]);

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
              location={location}
              noteId={noteId}
              setLocation={setLocation}
              onclose={close}
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
