import { TargetIcon } from '@monorepo/expo/shared/icons';
import { Colors, Spacings } from '@monorepo/expo/shared/static';
import {
  Button,
  Copy,
  TextBold,
  TextButton,
  TextRegular,
} from '@monorepo/expo/shared/ui-components';
import { useState } from 'react';
import { Platform, Pressable, View } from 'react-native';
import openMap from 'react-native-open-maps';
import { LocationDraft } from '../../HmisProgramNoteForm';

interface ISelectedProps {
  currentLocation: {
    latitude: number;
    longitude: number;
    shortAddressName: string | undefined;
  };
  address:
    | { full: string; short: string; addressComponents: any[] }
    | undefined
    | null;
  setChooseDirections: (chooseDirections: boolean) => void;
  setSelected: (selected: boolean) => void;
  onSelectLocation: (location: LocationDraft) => void;
  minimizeModal: boolean;
  setValue: (key: string, data: any, options?: any) => void;
}

export default function Selected(props: ISelectedProps) {
  const {
    currentLocation,
    address,
    setChooseDirections,
    setSelected,
    onSelectLocation,
    minimizeModal,
    setValue,
  } = props;
  const [copy, setCopy] = useState<string | null>();

  const handleIosDirections = () => {
    setChooseDirections(true);
    setSelected(false);
  };

  async function selectLocation() {
    onSelectLocation({
      longitude: currentLocation?.longitude,
      latitude: currentLocation?.latitude,
      formattedAddress: address?.full || '',
      shortAddressName: currentLocation?.shortAddressName || '',
      components: address?.addressComponents || [],
    });

    setValue(
      'location',
      {
        longitude: currentLocation?.longitude,
        latitude: currentLocation?.latitude,
        formattedAddress: address?.full,
        shortAddressName: currentLocation?.shortAddressName,
        components: address?.addressComponents || [],
      },
      {
        shouldDirty: true,
        shouldTouch: true,
        shouldValidate: true,
      }
    );
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
      <TextBold mx="md">
        {currentLocation?.shortAddressName
          ? currentLocation?.shortAddressName
          : address?.short}
      </TextBold>
      <View
        style={{
          position: 'relative',
          backgroundColor:
            copy === 'address' ? Colors.NEUTRAL_EXTRA_LIGHT : 'transparent',
        }}
      >
        {copy === 'address' && address?.full && (
          <Copy closeCopy={() => setCopy(null)} textToCopy={address.full} />
        )}
        <Pressable
          style={{ paddingVertical: Spacings.xs }}
          accessibilityRole="button"
          accessibilityHint="long press to copy address"
          onLongPress={() => setCopy('address')}
        >
          <TextRegular mx="md">{address?.full}</TextRegular>
        </Pressable>
      </View>
      {!minimizeModal && (
        <>
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

              marginBottom: Spacings.sm,
              width: '100%',
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
            <View
              style={{
                paddingHorizontal: Spacings.md,
                flexDirection: 'row',
                alignItems: 'center',
                gap: Spacings.sm,
              }}
            >
              <TargetIcon color={Colors.PRIMARY_EXTRA_DARK} />
              <Pressable
                style={{ paddingVertical: Spacings.xs }}
                accessibilityRole="button"
                accessibilityHint="long press to copy coordinates"
                onLongPress={() => setCopy('geo')}
              >
                <TextBold style={{ flex: 1 }}>
                  {currentLocation.latitude.toFixed(7)}{' '}
                  {currentLocation.longitude.toFixed(7)}
                </TextBold>
              </Pressable>
            </View>
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
        </>
      )}
    </View>
  );
}
