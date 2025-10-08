import { LocationPinIcon } from '@monorepo/expo/shared/icons';
import {
  Colors,
  Radiuses,
  Shadow,
  Spacings,
} from '@monorepo/expo/shared/static';
import { memo } from 'react';
import { StyleSheet, View } from 'react-native';
import TextBold from '../../TextBold';

export interface ILocationMarkerProps {
  label?: string;
}

const PIN_W = 25;
const PIN_H = 36;

// Reserve enough height so Android's first snapshot includes the pill.
// This closely matches your original TextBold "sm" + padding.
const BADGE_MIN_H = 22;
const BADGE_GAP = Spacings.xs;

function CustomLocationMarker({ label }: ILocationMarkerProps) {
  return (
    <View style={styles.container} collapsable={false} pointerEvents="none">
      {label ? (
        <View style={styles.badgeOuter} collapsable={false}>
          <View style={styles.badge} collapsable={false}>
            <TextBold size="sm">{label}</TextBold>
          </View>
        </View>
      ) : (
        // keep overall height stable even when no label
        <View style={{ height: BADGE_MIN_H + BADGE_GAP }} collapsable={false} />
      )}

      <View style={{ width: PIN_W, height: PIN_H }} collapsable={false}>
        <LocationPinIcon width={PIN_W} height={PIN_H} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },

  badgeOuter: {
    paddingHorizontal: Spacings.sm,
    paddingTop: Spacings.xs,
    marginBottom: BADGE_GAP,
    minHeight: BADGE_MIN_H + BADGE_GAP, // reserve space so it never clips
    justifyContent: 'flex-end',
    alignItems: 'center',
  },

  badge: {
    paddingHorizontal: Spacings.xs,
    backgroundColor: Colors.WHITE,
    borderRadius: Radiuses.xxxl,
    ...Shadow,
    alignSelf: 'center',
  },
});

export const LocationMarker = memo(CustomLocationMarker);
