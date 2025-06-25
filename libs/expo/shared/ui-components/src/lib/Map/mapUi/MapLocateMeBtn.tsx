import { RefObject } from 'react';
import { Alert, StyleSheet } from 'react-native';
import LocateMeButton from '../../LocateMeButton';
import { TMapDeltaLatLng, TMapView } from '../types';
import { goToUserLocation } from '../utils';

type TProps = {
  mapRef: RefObject<TMapView | null>;
  regionDelta?: TMapDeltaLatLng;
  duration?: number;
};

export function MapLocateMeBtn(props: TProps) {
  const { mapRef, regionDelta, duration } = props;

  function onPermissionDenied() {
    console.log('################################### onPermissionDenied');

    const alertTitle = 'Allow Better Angels to use your location?';
    const alertMsg = 'Go to Settings to change your Location Permission.';

    Alert.alert(alertTitle, alertMsg, [
      {
        text: 'Cancel',
        onPress: () => console.log('Cancel Pressed'),
        style: 'cancel',
      },
      { text: 'Settings', onPress: () => console.log('Settings Pressed') },
    ]);
  }

  return (
    <LocateMeButton
      style={styles.locateMeButton}
      onPress={() =>
        goToUserLocation({ mapRef, regionDelta, duration, onPermissionDenied })
      }
    />
  );
}

const styles = StyleSheet.create({
  locateMeButton: {
    position: 'absolute',
    right: 16,
    bottom: '15%',
    zIndex: 10,
  },
});
