import {
  LocationArrowIcon,
  LocationPinIcon,
  SearchIcon,
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
} from '@monorepo/expo/shared/ui-components';
import { useState } from 'react';
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
        !location && !isLocation ? <H5 size="sm">Add Location</H5> : null
      }
    >
      <View style={{ paddingBottom: Spacings.md }}>
        <MapView
          zoomEnabled={false}
          scrollEnabled={false}
          provider={PROVIDER_GOOGLE}
          region={{
            longitudeDelta: 0.005,
            latitudeDelta: 0.005,
            latitude: location ? location.latitude : INITIAL_LOCATION.latitude,
            longitude: location
              ? location.longitude
              : INITIAL_LOCATION.longitude,
          }}
          initialRegion={{
            longitudeDelta: 0.005,
            latitudeDelta: 0.005,
            longitude: INITIAL_LOCATION.longitude,
            latitude: INITIAL_LOCATION.latitude,
          }}
          style={styles.map}
        >
          {location && (
            <Marker
              coordinate={{
                latitude: location.latitude,
                longitude: location.longitude,
              }}
            />
          )}
        </MapView>
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
              <Input
                icon={<SearchIcon ml="sm" color={Colors.NEUTRAL_LIGHT} />}
                componentStyle={{
                  top: Spacings.sm,
                }}
                name="searchLocation"
                control={control}
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
                  <BodyText mb="md">
                    Near 25 Flower St. Los Angeles, CA 90012
                  </BodyText>
                  <Button
                    onPress={() => {
                      setValue('location', currentLocation);
                      setCurrentLocation(undefined);
                      setPin(false);
                      // closeModal();
                    }}
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
              onPress={(e) => {
                if (isLocation && pin) {
                  setValue('location', undefined);
                  setCurrentLocation({
                    longitude: e.nativeEvent.coordinate.longitude,
                    latitude: e.nativeEvent.coordinate.latitude,
                  });
                }
              }}
              provider={PROVIDER_GOOGLE}
              region={{
                longitudeDelta: 0.005,
                latitudeDelta: 0.005,
                latitude: location
                  ? location.latitude
                  : INITIAL_LOCATION.latitude,
                longitude: location
                  ? location.longitude
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
    height: 97,
  },
});
