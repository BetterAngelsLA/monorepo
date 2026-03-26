/**
 * BottomSheetFullScreenContainer
 *
 * Optional container that renders sheets above native navigation layers.
 *
 * Required when using `react-native-screens` with native modal
 * presentations on iOS, where sheets may otherwise render behind
 * the current screen.
 *
 * Implementation:
 * - iOS   → FullWindowOverlay
 * - other → absolute positioned View
 *
 * Usage:
 * - Passed via `containerComponent` (provider or per-sheet)
 *
 * See `useBottomSheet` for integration details.
 */

import { ReactNode } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { FullWindowOverlay } from 'react-native-screens';

type TProps = {
  children?: ReactNode;
};

export function BottomSheetFullScreenContainer(props: TProps) {
  const { children } = props;

  if (Platform.OS === 'ios') {
    return <FullWindowOverlay>{children}</FullWindowOverlay>;
  }

  return (
    <View pointerEvents="box-none" style={styles.container}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    elevation: 1,
  },
});
