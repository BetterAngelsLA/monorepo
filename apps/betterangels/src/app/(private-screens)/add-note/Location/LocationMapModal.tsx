import {
  LocationArrowIcon,
  LocationPinIcon,
  SearchIcon,
  TargetIcon,
} from '@monorepo/expo/shared/icons';
import { Colors, Spacings } from '@monorepo/expo/shared/static';
import {
  BodyText,
  Button,
  H3,
  H4,
  IconButton,
  InputBasic,
} from '@monorepo/expo/shared/ui-components';
import axios from 'axios';
import { useState } from 'react';
import { useFormContext } from 'react-hook-form';
import { Modal, Pressable, View } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import openMap from 'react-native-open-maps';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const apiKey = process.env.EXPO_PUBLIC_GOOGLEMAPS_APIKEY;

const INITIAL_LOCATION = {
  longitude: -118.258815,
  latitude: 34.048655,
};

type locationLongLat = {
  longitude: number;
  latitude: number;
  name: string | undefined;
};

interface ILocationMapModalProps {
  isModalVisible: boolean;
  toggleModal: (e: boolean) => void;
  setExpanded: (e: string | undefined | null) => void;
}

export default function LocationMapModal(props: ILocationMapModalProps) {
  const { isModalVisible, toggleModal, setExpanded } = props;
  const { trigger, setValue, watch } = useFormContext();
  const [pin, setPin] = useState(false);
  const [initialRegion, setInitialRegion] = useState(INITIAL_LOCATION);
  const [address, setAddress] = useState<
    { short: string; full: string } | undefined
  >({
    short: '',
    full: '',
  });
  const [currentLocation, setCurrentLocation] = useState<
    locationLongLat | undefined
  >(undefined);

  const insets = useSafeAreaInsets();
  const bottomOffset = insets.bottom;
  const location = watch('location');

  const closeModal = () => {
    trigger('location.address');
    toggleModal(false);
    setExpanded(undefined);
  };

  function selectLocation() {
    setValue('location', {
      longitude: currentLocation?.longitude,
      latitude: currentLocation?.latitude,
      address: address?.full,
      name: currentLocation?.name,
    });
    closeModal();
  }

  function onMapPress(e: any) {
    if (pin) {
      setAddress(undefined);
      setCurrentLocation(undefined);
      setValue('location', undefined);
      setPin(false);
    }
  }

  async function placePin(e: any, isId: boolean) {
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
        setCurrentLocation({
          longitude,
          latitude,
          name,
        });

        setInitialRegion({
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
      } catch (e) {
        console.log(e);
      }
    } else {
      setAddress(undefined);
      setCurrentLocation(undefined);
      setPin(false);
    }
  }
  return (
    <Modal
      style={{ flex: 1 }}
      animationType="slide"
      transparent={true}
      visible={isModalVisible}
      onRequestClose={closeModal}
    >
      <View
        style={{
          borderTopEndRadius: 10,
          borderTopLeftRadius: 10,
          marginTop: '15%',
          overflow: 'hidden',
          flex: 1,
        }}
      >
        <View
          style={{
            alignItems: 'center',
            flexDirection: 'row',
            justifyContent: 'space-between',
            backgroundColor: Colors.WHITE,
            paddingHorizontal: Spacings.sm,
            paddingTop: Spacings.sm,
            paddingBottom: Spacings.xs,
            borderBottomWidth: 0.5,
            borderBottomColor: Colors.NEUTRAL_LIGHT,
          }}
        >
          <Pressable
            style={{ marginRight: Spacings.xs, flex: 1 }}
            accessibilityRole="button"
            onPress={closeModal}
            accessibilityHint="close map modal"
          >
            <BodyText size="sm">Back</BodyText>
          </Pressable>
          <H4
            align="center"
            style={{
              flex: 2,
            }}
          >
            Type or Pin Location
          </H4>
          <View style={{ flex: 1 }} />
        </View>
        <View
          style={{
            position: 'relative',
            flex: 1,
          }}
        >
          <View
            style={{
              position: 'absolute',
              zIndex: 100,
              paddingHorizontal: Spacings.sm,
              width: '100%',
            }}
          >
            <InputBasic
              componentStyle={{
                top: Spacings.sm,
              }}
              icon={<SearchIcon ml="sm" color={Colors.NEUTRAL_LIGHT} />}
              value={address?.short}
              onChangeText={(e) =>
                setAddress({
                  full: e,
                  short: e,
                })
              }
            />
          </View>
          <View
            style={{
              position: 'absolute',
              bottom: 0,
              width: '100%',
              left: 0,
              zIndex: 100,
            }}
          >
            <View
              style={{
                alignSelf: 'flex-end',
                paddingRight: Spacings.sm,
                marginBottom: Spacings.md,
                position: 'absolute',
                bottom: '100%',
                right: 0,
                zIndex: 100,
              }}
            >
              <IconButton
                style={{
                  elevation: 5,
                  shadowColor: Colors.NEUTRAL_DARK,
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.25,
                  shadowRadius: 3.84,
                }}
                accessibilityLabel="user location"
                variant="secondary"
                accessibilityHint="get user location"
              >
                <LocationArrowIcon color={Colors.PRIMARY} />
              </IconButton>
            </View>
            {currentLocation && (
              <View
                style={{
                  backgroundColor: Colors.WHITE,
                  paddingHorizontal: Spacings.md,
                  paddingBottom: Spacings.md,
                  paddingTop: Spacings.sm,
                  borderTopLeftRadius: 20,
                  borderTopRightRadius: 20,
                }}
              >
                <H3 mb="xs">
                  {currentLocation?.name
                    ? currentLocation?.name
                    : address?.short}
                </H3>
                <Pressable
                  onPress={() =>
                    openMap({
                      latitude: currentLocation.latitude,
                      longitude: currentLocation.longitude,
                      query: address?.full,
                    })
                  }
                  accessibilityHint="opens map apps"
                  accessibilityRole="button"
                >
                  <BodyText mb="md">{address?.full}</BodyText>
                </Pressable>
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: Spacings.sm,
                    marginBottom: Spacings.sm,
                  }}
                >
                  <TargetIcon color={Colors.PRIMARY_EXTRA_DARK} />
                  <H3 style={{ flex: 1 }}>
                    {currentLocation.latitude.toFixed(7)}{' '}
                    {currentLocation.longitude.toFixed(7)}
                  </H3>
                </View>
                <Button
                  onPress={selectLocation}
                  size="full"
                  title="Select this location"
                  accessibilityHint="select pinned location"
                  variant="primary"
                />
              </View>
            )}
            <View
              style={{
                height: bottomOffset,
                backgroundColor: currentLocation ? Colors.WHITE : 'transparent',
              }}
            />
          </View>
          <MapView
            mapType="standard"
            onPoiClick={(e) => placePin(e, true)}
            zoomEnabled
            scrollEnabled
            onPress={onMapPress}
            onLongPress={(e) => placePin(e, false)}
            provider={PROVIDER_GOOGLE}
            region={{
              longitudeDelta: 0.005,
              latitudeDelta: 0.005,
              latitude: currentLocation
                ? currentLocation.latitude
                : initialRegion.latitude,
              longitude: currentLocation
                ? currentLocation.longitude
                : initialRegion.longitude,
            }}
            initialRegion={{
              longitudeDelta: 0.005,
              latitudeDelta: 0.005,
              longitude: initialRegion.longitude,
              latitude: initialRegion.latitude,
            }}
            style={{
              height: '100%',
              width: '100%',
            }}
          >
            {(currentLocation || (location && location.address)) && (
              <Marker
                coordinate={{
                  latitude: location
                    ? location.latitude
                    : currentLocation?.latitude,
                  longitude: location
                    ? location.longitude
                    : currentLocation?.longitude,
                }}
              >
                <LocationPinIcon size="2xl" />
              </Marker>
            )}
          </MapView>
        </View>
      </View>
    </Modal>
  );
}
