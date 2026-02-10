import { useApiConfig } from '@monorepo/expo/shared/clients';
import { LocationPinIcon } from '@monorepo/expo/shared/icons';
import { Colors, Spacings } from '@monorepo/expo/shared/static';
import { FieldCard, TextMedium } from '@monorepo/expo/shared/ui-components';
import { Dispatch, SetStateAction } from 'react';
import { useFormContext } from 'react-hook-form';
import { StyleSheet, View } from 'react-native';
import { useInitialLocation } from '../../../hooks';
import { MapView, Marker, PROVIDER_GOOGLE } from '../../../maps';
import { useModalScreen } from '../../../providers';
import { LocationMapModal, TLocationData } from '../../../ui-components';
import { LocationDraft } from '../HmisProgramNoteForm';

const FIELD_KEY = 'location';

type SectionKey =
  | 'location'
  | 'title'
  | 'date'
  | 'refClientProgram'
  | 'note'
  | 'services'
  | 'tasks'
  | null;

interface ILocationProps {
  expanded: boolean;
  setExpanded: Dispatch<SetStateAction<SectionKey>>;
  editing?: boolean;
  error?: string;
}

export default function HmisLocationComponent(props: ILocationProps) {
  const { expanded, setExpanded, editing, error } = props;

  const { baseUrl } = useApiConfig();
  const { showModalScreen } = useModalScreen();
  const { setValue, watch } = useFormContext();
  const location = watch('location');

  const [userLocation] = useInitialLocation(
    baseUrl,
    editing,
    location,
    setValue
  );

  const setLocation = (locationData: LocationDraft) => {
    setValue('location', locationData, {
      shouldDirty: true,
      shouldTouch: true,
      shouldValidate: true,
    });
  };

  const handleSelectLocation = (data: TLocationData) => {
    const locationDraft: LocationDraft = {
      latitude: data.latitude,
      longitude: data.longitude,
      shortAddressName: data.name,
      formattedAddress: data.address,
      components: data.addressComponents,
    };
    setLocation(locationDraft);
  };

  const isLocation = expanded;

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
          renderContent: ({ close }) => (
            <LocationMapModal
              userLocation={userLocation}
              initialLocation={
                location
                  ? {
                      latitude: location.latitude,
                      longitude: location.longitude,
                      name: location.shortAddressName || undefined,
                      address: location.formattedAddress || undefined,
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
