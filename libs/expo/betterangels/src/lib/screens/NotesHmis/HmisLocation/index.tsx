import { useApiConfig } from '@monorepo/expo/shared/clients';
import { LocationPinIcon } from '@monorepo/expo/shared/icons';
import { Colors, Spacings } from '@monorepo/expo/shared/static';
import { FieldCard, TextMedium } from '@monorepo/expo/shared/ui-components';
import axios from 'axios';
import * as ExpoLocation from 'expo-location';
import { Dispatch, SetStateAction, useEffect, useRef, useState } from 'react';
import { useFormContext } from 'react-hook-form';
import { StyleSheet, View } from 'react-native';
import { MapView, Marker, PROVIDER_GOOGLE } from '../../../maps';
import { useModalScreen } from '../../../providers';
import LocationMapModal from './LocationMapModal';

const FIELD_KEY = 'location';

type SectionKey =
  | 'location'
  | 'title'
  | 'date'
  | 'refClientProgram'
  | 'note'
  | 'services'
  | 'draftTasks'
  | null;

const INITIAL_LOCATION = {
  longitude: -118.258815,
  latitude: 34.048655,
};

interface ILocationProps {
  expanded: boolean;
  setExpanded: Dispatch<SetStateAction<SectionKey>>;
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

export default function HmisLocationComponent(props: ILocationProps) {
  const { expanded, setExpanded, address, point } = props;

  const { baseUrl } = useApiConfig();

  const { setValue } = useFormContext();

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

  const isLocation = expanded;
  const { showModalScreen, closeModalScreen } = useModalScreen();

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

        const url = `${baseUrl}/proxy/maps/api/geocode/json?latlng=${latitude},${longitude}`;
        const { data } = await axios.get(url, {
          params: {
            withCredentials: true,
          },
        });

        const result = data.results?.[0];
        const formattedAddress: string | null =
          result?.formatted_address ?? null;
        const shortName: string | null = formattedAddress
          ? formattedAddress.split(', ')[0]
          : null;
        const components = result?.address_components ?? [];

        const newLocation: TLocation = {
          latitude,
          longitude,
          address: formattedAddress,
          name: shortName,
        };

        setLocation(newLocation);

        setValue('location', {
          longitude,
          latitude,
          formattedAddress,
          components,
        });
      } catch (err) {
        console.error('Error auto-setting initial location', err);
      }
    };

    void autoSetInitialLocation();
  }, [point, address, baseUrl, location]);

  return (
    <FieldCard
      required
      mb="xs"
      setExpanded={() => {
        setExpanded(isLocation ? null : FIELD_KEY);

        showModalScreen({
          presentation: 'modal',
          title: 'Type or Pin Location',

          content: (
            <LocationMapModal
              setValue={setValue}
              location={location}
              setLocation={setLocation}
              onclose={closeModalScreen}
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
