import { TargetIcon } from '@monorepo/expo/shared/icons';
import { Colors, Spacings } from '@monorepo/expo/shared/static';
import {
  BodyText,
  Button,
  H3,
  TextButton,
} from '@monorepo/expo/shared/ui-components';
import { useFormContext } from 'react-hook-form';
import { Platform, View } from 'react-native';
import openMap from 'react-native-open-maps';

interface ISelectedProps {
  currentLocation: {
    latitude: number;
    longitude: number;
    name: string | undefined;
  };
  address: { full: string; short: string } | undefined;
  setChooseDirections: (e: boolean) => void;
  setSelected: (e: boolean) => void;
  closeModal: () => void;
}

export default function Selected(props: ISelectedProps) {
  const {
    currentLocation,
    address,
    setChooseDirections,
    setSelected,
    closeModal,
  } = props;
  const { setValue } = useFormContext();

  const handleIosDirections = () => {
    setChooseDirections(true);
    setSelected(false);
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

  return (
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
        {currentLocation?.name ? currentLocation?.name : address?.short}
      </H3>

      <BodyText>{address?.full}</BodyText>
      <TextButton
        onPress={() => {
          Platform.OS === 'ios'
            ? handleIosDirections()
            : openMap({
                end: `${currentLocation?.latitude},${currentLocation?.longitude}`,
                query: address?.full,
                provider: 'google',
              });
        }}
        fontSize="sm"
        color={Colors.PRIMARY}
        mb="md"
        mt="xs"
        accessibilityHint="opens maps to get directions"
        title="Get directions"
      />
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
  );
}
