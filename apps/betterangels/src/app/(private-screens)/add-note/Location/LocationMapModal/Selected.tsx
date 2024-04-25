import { useMutation } from '@apollo/client';
import {
  UPDATE_NOTE_LOCATION,
  UpdateNoteLocationMutation,
  UpdateNoteLocationMutationVariables,
} from '@monorepo/expo/betterangels';
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

type TLocation =
  | {
      address: string | null | undefined;
      latitude: number | null | undefined;
      longitude: number | null | undefined;
      name: string | null | undefined;
    }
  | undefined;

interface ISelectedProps {
  currentLocation: {
    latitude: number;
    longitude: number;
    name: string | undefined;
  };
  address:
    | { full: string; short: string; addressComponents: any[] }
    | undefined
    | null;
  setChooseDirections: (chooseDirections: boolean) => void;
  setSelected: (selected: boolean) => void;
  closeModal: (hasLocation: boolean) => void;
  setLocation: (location: TLocation) => void;
  noteId: string | undefined;
}

export default function Selected(props: ISelectedProps) {
  const {
    currentLocation,
    address,
    setChooseDirections,
    setSelected,
    closeModal,
    setLocation,
    noteId,
  } = props;
  const [copy, setCopy] = useState<string | null>();
  const [updateNoteLocation, { error }] = useMutation<
    UpdateNoteLocationMutation,
    UpdateNoteLocationMutationVariables
  >(UPDATE_NOTE_LOCATION);

  const handleIosDirections = () => {
    setChooseDirections(true);
    setSelected(false);
  };

  async function selectLocation() {
    setLocation({
      longitude: currentLocation?.longitude,
      latitude: currentLocation?.latitude,
      address: address?.full,
      name: currentLocation?.name,
    });

    closeModal(true);
    try {
      if (address && currentLocation) {
        const { data } = await updateNoteLocation({
          variables: {
            data: {
              point: [currentLocation.longitude, currentLocation.latitude],
              address: {
                addressComponents: JSON.stringify(address.addressComponents),
                formattedAddress: address.full,
              },
              id: noteId,
            },
          },
        });
        if (!data) {
          console.error(error);
        }
      }
    } catch (err) {
      console.error(err);
    }
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
        {currentLocation?.name ? currentLocation?.name : address?.short}
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
    </View>
  );
}
