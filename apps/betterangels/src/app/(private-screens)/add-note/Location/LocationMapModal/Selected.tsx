import { TargetIcon } from '@monorepo/expo/shared/icons';
import { Colors, Spacings } from '@monorepo/expo/shared/static';
import {
  BodyText,
  Button,
  Copy,
  H3,
  TextButton,
} from '@monorepo/expo/shared/ui-components';
import { useState } from 'react';
import { useFormContext } from 'react-hook-form';
import { Platform, Pressable, View } from 'react-native';
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
  const [copy, setCopy] = useState<string | null>();

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
        paddingBottom: Spacings.md,
        paddingTop: Spacings.sm,
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
      }}
    >
      <H3 mx="md">
        {currentLocation?.name ? currentLocation?.name : address?.short}
      </H3>
      <View
        style={{
          position: 'relative',
          paddingVertical: Spacings.xs,
          backgroundColor:
            copy === 'address' ? Colors.NEUTRAL_EXTRA_LIGHT : 'transparent',
        }}
      >
        {copy === 'address' && address?.full && (
          <Copy closeCopy={() => setCopy(null)} textToCopy={address.full} />
        )}
        <Pressable
          accessibilityRole="button"
          accessibilityHint="long press to copy address"
          onLongPress={() => setCopy('address')}
        >
          <BodyText mx="md">{address?.full}</BodyText>
        </Pressable>
      </View>
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
        mx="md"
        mb="sm"
        accessibilityHint="opens maps to get directions"
        title="Get directions"
      />

      <View
        style={{
          position: 'relative',
          flexDirection: 'row',
          alignItems: 'center',
          paddingVertical: Spacings.xs,
          gap: Spacings.sm,
          marginBottom: Spacings.sm,
          paddingHorizontal: Spacings.md,
          backgroundColor:
            copy === 'geo' ? Colors.NEUTRAL_EXTRA_LIGHT : 'transparent',
        }}
      >
        {copy === 'geo' && currentLocation.longitude && (
          <Copy
            closeCopy={() => setCopy(null)}
            textToCopy={`${currentLocation.longitude} ${currentLocation.latitude}`}
          />
        )}
        <TargetIcon color={Colors.PRIMARY_EXTRA_DARK} />
        <Pressable
          accessibilityRole="button"
          accessibilityHint="long press to copy coordinates"
          onLongPress={() => setCopy('geo')}
        >
          <H3 style={{ flex: 1 }}>
            {currentLocation.latitude.toFixed(7)}{' '}
            {currentLocation.longitude.toFixed(7)}
          </H3>
        </Pressable>
      </View>
      <View style={{ paddingHorizontal: Spacings.md }}>
        <Button
          onPress={selectLocation}
          size="full"
          title="Select this location"
          accessibilityHint="select pinned location"
          variant="primary"
        />
      </View>
    </View>
  );
}
