import { RefObject } from 'react';
import { StyleSheet } from 'react-native';
import LocateMeButton from '../../LocateMeButton';
import { TRNMapView } from '../mapLib';
import { goToUserLocation } from '../utils/goToUserLocation';

type TProps = {
  mapRef: RefObject<TRNMapView | null>;
  latDelta?: number;
  lngDelta?: number;
  duration?: number;
};

export function MapLocateMeBtn(props: TProps) {
  return (
    <LocateMeButton
      style={styles.locateMeButton}
      onPress={() =>
        goToUserLocation({
          ...props,
        })
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
