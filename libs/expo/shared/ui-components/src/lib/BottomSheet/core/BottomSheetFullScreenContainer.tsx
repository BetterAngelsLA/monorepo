/**
 * BottomSheetFullScreenContainer
 *
 * Container component used by `@gorhom/bottom-sheet` to render sheets
 * above native navigation screens.
 *
 * ---------------------------------------------------------------------
 * WHY THIS EXISTS
 * ---------------------------------------------------------------------
 *
 * When using navigation stacks powered by `react-native-screens`
 * (such as Expo Router or React Navigation), certain modal presentations
 * (`presentation: 'modal'`, `fullScreenModal`, etc.) are rendered inside
 * a native view controller layer above the React Native root view.
 *
 * In these cases, a BottomSheet rendered from the normal React tree may
 * appear *behind* the modal screen, even when using portals.
 *
 * `FullWindowOverlay` mounts the sheet at the top-most native window
 * layer so it correctly appears above modal screens.
 *
 * ---------------------------------------------------------------------
 * PLATFORM BEHAVIOR
 * ---------------------------------------------------------------------
 *
 * `FullWindowOverlay` is only available on **iOS**.
 *
 * On Android and Web this container simply renders its children normally,
 * as the underlying navigation stack does not suffer from the same
 * layering issue.
 *
 * ---------------------------------------------------------------------
 * WHEN TO USE
 * ---------------------------------------------------------------------
 *
 * Use this container when your app:
 *
 * - uses `react-native-screens`
 * - presents modal routes using native presentation styles
 * - needs BottomSheets to appear above those modal screens
 *
 * ---------------------------------------------------------------------
 * HOW TO ENABLE
 * ---------------------------------------------------------------------
 *
 * Pass this component as the `containerComponent` option.
 *
 * Recommended: configure globally via `BottomSheetModalProvider`.
 *
 * Example:
 *
 * showBottomSheet({
 *   render: () => <MySheet />,
 *   options: {
 *     containerComponent: BottomSheetFullScreenContainer
 *   }
 * });
 */

import { ReactNode } from 'react';
import { Platform } from 'react-native';
import { FullWindowOverlay } from 'react-native-screens';

type TProps = {
  children?: ReactNode;
};

export function BottomSheetFullScreenContainer(props: TProps) {
  const { children } = props;

  if (Platform.OS !== 'ios') {
    return children ?? null;
  }

  return <FullWindowOverlay>{children}</FullWindowOverlay>;
}
