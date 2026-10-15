import { showOpenSettingsAlert } from '@monorepo/expo/shared/utils';
import { LocationObject } from 'expo-location';
import { RefObject, useState } from 'react';
import { StyleSheet, ViewStyle } from 'react-native';
import LocateMeButton from '../LocateMeButton';
import { TMapDeltaLatLng, TMapView } from './types';
import { goToUserLocation } from './utils';

type TVariant = 'absolute' | 'relative';

type TProps = {
  mapRef: RefObject<TMapView | null>;
  regionDelta?: TMapDeltaLatLng;
  duration?: number;
  onLocated?: (location: LocationObject) => void;
  accessibilityLabel?: string;
  accessibilityHint?: string;
  variant?: TVariant;
  style?: ViewStyle;
};

export function MapLocateMeBtn(props: TProps) {
  const {
    mapRef,
    regionDelta,
    duration,
    onLocated,
    accessibilityLabel,
    accessibilityHint,
    variant = 'absolute',
    style,
  } = props;

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
      const newLocation = await goToUserLocation({
        mapRef,
        regionDelta,
        duration,
        onPermissionDenied,
      });

      if (newLocation) {
        onLocated?.(newLocation);
      }

      setDisabled(false);
    } catch (e) {
      console.error(`MapLocateMeBtn onPress error: ${e}`);

      setDisabled(false);
    }
  }

  return (
    <LocateMeButton
      style={[
        styles.container,
        variant === 'absolute' ? styles.absolutePosition : undefined,
        style,
      ]}
      disabled={disabled}
      onPress={onPress}
      accessibilityLabel={accessibilityLabel}
      accessibilityHint={accessibilityHint}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    zIndex: 10,
  },
  absolutePosition: {
    position: 'absolute',
    right: 16,
    bottom: '15%',
  },
});
