import { LocationPinIcon } from '@monorepo/expo/shared/icons';
import { Colors, Spacings } from '@monorepo/expo/shared/static';
import { FieldCard, H5 } from '@monorepo/expo/shared/ui-components';
import { useState } from 'react';
import { Controller, useFormContext } from 'react-hook-form';
import { StyleSheet, TextInput, View } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import LocationMapModal from './LocationMapModal';

interface ILocationProps {
  expanded: string | undefined | null;
  setExpanded: (e: string | undefined | null) => void;
}

export default function LocationComponent(props: ILocationProps) {
  const { expanded, setExpanded } = props;
  const {
    control,
    watch,
    formState: { errors },
  } = useFormContext();
  const [isModalVisible, toggleModal] = useState(false);

  const location = watch('location');
  const isLocation = expanded === 'Location';

  return (
    <FieldCard
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
          <H5 size="sm">Add Location</H5>
        ) : (
          <H5 size="sm">
            {location && location.latitude
              ? location?.name
                ? location.name
                : location.address.split(', ')[0]
              : 'Add Location'}
          </H5>
        )
      }
    >
      <Controller
        control={control}
        name="location.address"
        rules={{ required: true }}
        render={({ field: { value, onChange } }) => (
          <TextInput
            style={{ height: 0, width: 0 }}
            accessibilityLabel=""
            accessibilityHint=""
            value={value}
            onChange={onChange}
          />
        )}
      />
      {location && location.address && (
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
