import { RefObject } from 'react';
import { StyleSheet } from 'react-native';
import LocateMeButton from '../../LocateMeButton';
import { TRNMapView } from '../mapLib';
import { TMapDeltaLatLng } from '../types';
import { goToUserLocation } from '../utils/goToUserLocation';

type TProps = {
  mapRef: RefObject<TRNMapView | null>;
  regionDelta?: TMapDeltaLatLng;
  duration?: number;
};

export function MapLocateMeBtn(props: TProps) {
  const { mapRef, regionDelta, duration } = props;

  return (
    <LocateMeButton
      style={styles.locateMeButton}
      onPress={() => goToUserLocation({ mapRef, regionDelta, duration })}
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
