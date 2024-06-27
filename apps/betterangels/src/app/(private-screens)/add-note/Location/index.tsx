import { LocationPinIcon } from '@monorepo/expo/shared/icons';
import { Colors, Spacings } from '@monorepo/expo/shared/static';
import { FieldCard, TextMedium } from '@monorepo/expo/shared/ui-components';
import { RefObject, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import LocationMapModal from './LocationMapModal';

interface ILocationProps {
  scrollRef: RefObject<ScrollView>;
  expanded: string | undefined | null;
  errors: {
    location: boolean;
    title: boolean;
    date: boolean;
    time: boolean;
  };
  setErrors: (errors: {
    location: boolean;
    title: boolean;
    date: boolean;
    time: boolean;
  }) => void;
  setExpanded: (expanded: string | undefined | null) => void;
  noteId: string | undefined;
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
  const [location, setLocation] = useState<TLocation>({
    latitude: point ? point[1] : null,
    longitude: point ? point[0] : null,
    address: address
      ? `${address.street}, ${address.city}, ${address.state} ${address.zipCode}`
      : null,
    name: address && address.street ? address.street : null,
  });

  const [isModalVisible, toggleModal] = useState(false);

  const isLocation = expanded === 'Location';

  return (
    <FieldCard
      scrollRef={scrollRef}
      required
      expanded={expanded}
      mb="xs"
      error={errors.location ? 'Please enter a location' : undefined}
      setExpanded={() => {
        if (isLocation) {
          setExpanded(undefined);
        } else {
          setExpanded(isLocation ? undefined : 'Location');

          toggleModal(true);
          setExpanded('Location');
        }
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
      <LocationMapModal
        setError={(err) =>
          setErrors({
            ...errors,
            location: err,
          })
        }
        setLocation={setLocation}
        location={location}
        noteId={noteId}
        toggleModal={toggleModal}
        setExpanded={setExpanded}
        isModalVisible={isModalVisible}
      />
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
