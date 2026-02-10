import { useState } from 'react';
import { Modal, Pressable, StyleSheet, View } from 'react-native';
import openMap from 'react-native-open-maps';
import TextRegular from '../TextRegular';
import { DirectionsActionSheet } from './DirectionsActionSheet';

interface IDirectionsPopupProps {
  address:
    | {
        street?: string | undefined | null;
        city?: string | undefined | null;
        state?: string | undefined | null;
        zipCode?: string | undefined | null;
      }
    | undefined;
}

export function DirectionsPopup(props: IDirectionsPopupProps) {
  const { address } = props;
  const [chooseDirections, setChooseDirections] = useState(false);

  const fullAddress = [
    address?.street,
    address?.city,
    address?.state,
    address?.zipCode,
  ]
    .filter(Boolean)
    .join(', ');

  const isDisabled = !address?.street;

  if (!address || isDisabled) {
    return null;
  }

  return (
    <>
      <TextRegular
        onPress={() => setChooseDirections(true)}
        textDecorationLine="underline"
        mt="xs"
      >
        {address?.street}
      </TextRegular>
      {chooseDirections && (
        <Modal
          visible={!!address}
          animationType="slide"
          transparent
          onRequestClose={() => setChooseDirections(false)}
        >
          <View style={styles.modalContainer}>
            <Pressable
              onPress={() => setChooseDirections(false)}
              style={StyleSheet.absoluteFillObject}
              accessibilityRole="button"
              accessibilityHint="Closes the map selection"
            />
            <DirectionsActionSheet
              onSelectApple={() =>
                openMap({
                  query: fullAddress,
                  provider: 'apple',
                  travelType: 'drive',
                })
              }
              onSelectGoogle={() =>
                openMap({
                  query: fullAddress,
                  provider: 'google',
                  travelType: 'drive',
                })
              }
              onCancel={() => setChooseDirections(false)}
            />
          </View>
        </Modal>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
  },
});
