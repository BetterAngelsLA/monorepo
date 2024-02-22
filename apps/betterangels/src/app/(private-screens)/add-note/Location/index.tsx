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
  FieldCard,
  H3,
  H4,
  H5,
  IconButton,
  Input,
  InputBasic,
} from '@monorepo/expo/shared/ui-components';
import axios from 'axios';
import { useMemo, useState } from 'react';
import { useFormContext } from 'react-hook-form';
import { Modal, Pressable, StyleSheet, View } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface ILocationProps {
  expanded: string | undefined | null;
  setExpanded: (e: string | undefined | null) => void;
}

type locationLongLat = {
  longitude: number;
  latitude: number;
};

const INITIAL_LOCATION = {
  longitude: -118.258815,
  latitude: 34.048655,
};

export default function Location(props: ILocationProps) {
  const { expanded, setExpanded } = props;
  const { control, watch, setValue } = useFormContext();
  const [pin, setPin] = useState(false);
  const [address, setAddress] = useState('');
  const insets = useSafeAreaInsets();
  const bottomOffset = insets.bottom;
  const [currentLocation, setCurrentLocation] = useState<
    locationLongLat | undefined
  >(undefined);
  const [isModalVisible, toggleModal] = useState(false);

  const location = watch('location');
  const isLocation = expanded === 'Location';

  const closeModal = () => {
    toggleModal(false);
    setExpanded(undefined);
  };

  function selectLocation() {
    setValue('location', {
      longitude: currentLocation?.longitude,
      latitude: currentLocation?.latitude,
      address,
    });
    setCurrentLocation(undefined);
    setPin(false);
    closeModal();
  }

  async function placePin(e: any) {
    if (isLocation && pin) {
      const latitude = e.nativeEvent.coordinate.latitude;
      const longitude = e.nativeEvent.coordinate.longitude;
      try {
        const { data } = await axios.get(
          `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${process.env.GOOGLEMAPS_APIKEY}`
        );
        setValue('location', undefined);
        setCurrentLocation({
          longitude,
          latitude,
        });

        const addressWithoutCountry = data.results[0].formatted_address
          .split(', ')
          .slice(0, -1)
          .join(', ');

        setAddress(addressWithoutCountry);
      } catch (e) {
        console.log(e);
      }
    }
  }

  const coords = useMemo(() => {
    if (location && location.address) {
      return {
        longitude: location.longitude,
        latitude: location.latitude,
      };
    }
    return {
      longitude: INITIAL_LOCATION.longitude,
      latitude: INITIAL_LOCATION.latitude,
    };
  }, [location]);

  console.log(location);

  return (
    <FieldCard
      required
      expanded={expanded}
      mb="xs"
      setExpanded={() => {
        !isLocation && toggleModal(true);
        setExpanded(isLocation ? undefined : 'Location');
      }}
      title="Location "
      actionName={
        (!location || (location && !location.address)) && !isLocation ? (
          <H5 size="sm">Add Location</H5>
        ) : (
          <H5 size="sm">{location?.address}</H5>
        )
      }
    >
      <View style={{ paddingBottom: Spacings.md }}>
        {!(location && location.address) && (
          <View style={{ position: 'relative' }}>
            <View
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                height: '100%',
                width: '100%',
                zIndex: 100,
              }}
            />

            <Input
              placeholder="Enter a location"
              required
              mb="xs"
              name="location.address"
              control={control}
            />
          </View>
        )}

        {location && location.address && (
          <MapView
            zoomEnabled={false}
            scrollEnabled={false}
            provider={PROVIDER_GOOGLE}
            region={{
              longitudeDelta: 0.005,
              latitudeDelta: 0.005,
              latitude: coords.latitude,
              longitude: coords.longitude,
            }}
            style={styles.map}
          >
            <Marker
              coordinate={{
                latitude:
                  location && location.address
                    ? location.latitude
                    : currentLocation?.latitude,
                longitude: location
                  ? location.longitude
                  : currentLocation?.longitude,
              }}
            >
              <LocationPinIcon size="2xl" />
            </Marker>
          </MapView>
        )}
      </View>
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
                value={address}
                onChangeText={(e) => setAddress(e)}
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
                  onPress={() => {
                    setPin(!pin);
                  }}
                  style={{
                    elevation: 5,
                    shadowColor: Colors.NEUTRAL_DARK,
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.25,
                    shadowRadius: 3.84,
                  }}
                  mb="xs"
                  accessibilityLabel="user location"
                  variant={pin ? 'primary' : 'secondary'}
                  accessibilityHint="get user location"
                >
                  <LocationPinIcon color={Colors.ERROR} />
                </IconButton>
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
                  }}
                >
                  <H3 mb="xs">Dropped Pin</H3>
                  <BodyText mb="md">{address}</BodyText>
                  <View
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: Spacings.sm,
                      marginBottom: Spacings.sm,
                    }}
                  >
                    <TargetIcon color={Colors.PRIMARY_EXTRA_DARK} />
                    <H3>
                      {currentLocation.latitude} {currentLocation.longitude}
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
                  backgroundColor: currentLocation
                    ? Colors.WHITE
                    : 'transparent',
                }}
              />
            </View>
            <MapView
              zoomEnabled
              scrollEnabled
              onPress={placePin}
              provider={PROVIDER_GOOGLE}
              region={{
                longitudeDelta: 0.005,
                latitudeDelta: 0.005,
                latitude: currentLocation
                  ? currentLocation.latitude
                  : INITIAL_LOCATION.latitude,
                longitude: currentLocation
                  ? currentLocation.longitude
                  : INITIAL_LOCATION.longitude,
              }}
              initialRegion={{
                longitudeDelta: 0.005,
                latitudeDelta: 0.005,
                longitude: INITIAL_LOCATION.longitude,
                latitude: INITIAL_LOCATION.latitude,
              }}
              style={{
                height: '100%',
                width: '100%',
              }}
            >
              {(currentLocation || location) && (
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
