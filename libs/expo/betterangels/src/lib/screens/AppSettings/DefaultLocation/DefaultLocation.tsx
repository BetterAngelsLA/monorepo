import { LocationPinIcon } from '@monorepo/expo/shared/icons';
import { Colors, Spacings } from '@monorepo/expo/shared/static';
import {
  FieldCard,
  PROVIDER_GOOGLE,
  TextMedium,
  TextRegular,
  TLocationData,
} from '@monorepo/expo/shared/ui-components';
import { StyleSheet, View } from 'react-native';
import { useInitialLocation, useSnackbar } from '../../../hooks';
import { MapView, Marker } from '../../../maps';
import { useModalScreen } from '../../../providers';
import { useUserDefaultNoteLocation } from '../../../state';
import { LocationMapModal, MainScrollContainer } from '../../../ui-components';
import { LocationDraft } from '../../NotesHmis/HmisProgramNoteForm';

export function DefaultLocation() {
  const [defaultLocation, setDefaultLocation] = useUserDefaultNoteLocation();
  const { showSnackbar } = useSnackbar();

  const { showModalScreen } = useModalScreen();

  const [userLocation] = useInitialLocation(undefined, undefined);

  const handleSelectLocation = (data: TLocationData) => {
    const locationDraft: LocationDraft = {
      latitude: data.latitude,
      longitude: data.longitude,
      shortAddressName: data.name,
      formattedAddress: data.address,
      components: data.addressComponents,
    };

    setDefaultLocation(locationDraft);

    showSnackbar({
      message: 'Default location is saved.',
      type: 'success',
    });
  };

  const getLocationLabel = () => {
    if (
      !defaultLocation ||
      !defaultLocation.formattedAddress ||
      !defaultLocation.latitude
    ) {
      return 'Set Default Location';
    }

    return (
      defaultLocation.shortAddressName ??
      defaultLocation.formattedAddress.split(', ')[0]
    );
  };

  return (
    <MainScrollContainer pb={0} bg={Colors.NEUTRAL_EXTRA_LIGHT}>
      <TextRegular size="sm" mb="md">
        Select the location that will be used by default throughout the app.
      </TextRegular>

      <FieldCard
        required
        mb="xs"
        setExpanded={() => {
          showModalScreen({
            presentation: 'modal',
            title: 'Type or Pin Location',
            renderContent: ({ close }) => (
              <LocationMapModal
                userLocation={userLocation}
                initialLocation={
                  defaultLocation &&
                  defaultLocation.latitude &&
                  defaultLocation.longitude
                    ? {
                        latitude: defaultLocation.latitude,
                        longitude: defaultLocation.longitude,
                        name: defaultLocation.shortAddressName || undefined,
                        address: defaultLocation.formattedAddress || undefined,
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
        actionName={<TextMedium size="sm">{getLocationLabel()}</TextMedium>}
      >
        {defaultLocation &&
          defaultLocation.longitude &&
          defaultLocation.latitude && (
            <View style={{ paddingBottom: Spacings.md }}>
              <MapView
                zoomEnabled={false}
                scrollEnabled={false}
                provider={PROVIDER_GOOGLE}
                region={{
                  longitudeDelta: 0.005,
                  latitudeDelta: 0.005,
                  latitude: defaultLocation.latitude,
                  longitude: defaultLocation.longitude,
                }}
                userInterfaceStyle="light"
                style={styles.map}
              >
                <Marker
                  coordinate={{
                    latitude: defaultLocation.latitude,
                    longitude: defaultLocation.longitude,
                  }}
                >
                  <LocationPinIcon size="2xl" />
                </Marker>
              </MapView>
            </View>
          )}
      </FieldCard>
    </MainScrollContainer>
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
