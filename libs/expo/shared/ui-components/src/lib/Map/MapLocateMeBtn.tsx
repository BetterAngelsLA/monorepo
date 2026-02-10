import { showOpenSettingsAlert } from '@monorepo/expo/shared/utils';
import { RefObject, useState } from 'react';
import { StyleSheet } from 'react-native';
import LocateMeButton from '../LocateMeButton';
import { TMapDeltaLatLng, TMapView } from './types';
import { goToUserLocation } from './utils';

type TProps = {
  mapRef: RefObject<TMapView | null>;
  regionDelta?: TMapDeltaLatLng;
  duration?: number;
};

export function MapLocateMeBtn(props: TProps) {
  const { mapRef, regionDelta, duration } = props;

  const [disabled, setDisabled] = useState(false);

  function onPermissionDenied() {
    showOpenSettingsAlert({
      title: 'Allow Better Angels to use your location?',
      message: 'Go to Settings to change your Location Permission.',
    });
  }

  async function onPress() {
    setDisabled(true);

    try {
      await goToUserLocation({
        mapRef,
        regionDelta,
        duration,
        onPermissionDenied,
      });

      setDisabled(false);
    } catch (e) {
      console.error(`MapLocateMeBtn onPress error: ${e}`);

      setDisabled(false);
    }
  }

  return (
    <LocateMeButton
      style={styles.locateMeButton}
      disabled={disabled}
      onPress={onPress}
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
