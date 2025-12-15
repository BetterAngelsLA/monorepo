import { useApiConfig } from '@monorepo/expo/shared/clients';
import { LocationPinIcon } from '@monorepo/expo/shared/icons';
import { Colors, Spacings } from '@monorepo/expo/shared/static';
import { FieldCard, TextMedium } from '@monorepo/expo/shared/ui-components';
import axios from 'axios';
import * as ExpoLocation from 'expo-location';
import { Dispatch, SetStateAction, useEffect, useRef } from 'react';
import { useFormContext } from 'react-hook-form';
import { StyleSheet, View } from 'react-native';
import { MapView, Marker, PROVIDER_GOOGLE } from '../../../maps';
import { useModalScreen } from '../../../providers';
import { LocationDraft } from '../HmisProgramNoteForm';
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
  editing?: boolean;
  error?: string;
}

type TLocation =
  | {
      formattedAddress: string | null | undefined;
      latitude: number | null | undefined;
      longitude: number | null | undefined;
      shortAddressName: string | null | undefined;
    }
  | undefined;

export default function HmisLocationComponent(props: ILocationProps) {
  const { expanded, setExpanded, editing, error } = props;

  const { baseUrl } = useApiConfig();

  const { setValue, watch } = useFormContext();
  const location = watch('location');

  const setLocation = (locationData: LocationDraft) => {
    setValue('location', locationData);
  };

  const locationRef = useRef<TLocation>(location);
  const autoFilledRef = useRef(false);

  useEffect(() => {
    locationRef.current = location;
  }, [location]);

  const isLocation = expanded;
  const { showModalScreen, closeModalScreen } = useModalScreen();

  // Auto-prefill on NEW notes: no point/address → use current or default location
  useEffect(() => {
    if (editing) {
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

        setValue('location', {
          ...location,
          longitude,
          latitude,
          formattedAddress,
          shortAddressName: shortName,
          components,
        });
      } catch (err) {
        console.error('Error auto-setting initial location', err);
      }
    };

    void autoSetInitialLocation();
  }, [baseUrl]);

  return (
    <FieldCard
      required
      mb="xs"
      error={error}
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
        (!location || (location && !location.formattedAddress)) &&
        !isLocation ? (
          <TextMedium size="sm">Add Location</TextMedium>
        ) : (
          <TextMedium size="sm">
            {location && location.latitude
              ? location?.shortAddressName
                ? location.shortAddressName
                : location.formattedAddress?.split(', ')[0]
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
