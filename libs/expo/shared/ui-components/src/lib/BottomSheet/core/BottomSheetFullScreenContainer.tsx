/**
 * BottomSheetFullScreenContainer
 *
 * Wraps BottomSheetModal content in `react-native-screens` `FullWindowOverlay`.
 *
 * *** Why this exists ***
 *
 * When using navigation stacks that rely on `react-native-screens`
 * (such as Expo Router or React Navigation), certain modal presentations
 * (`presentation: 'modal'`, `fullScreenModal`, etc.) render in a native
 * view controller layer above the React Native root view.
 *
 * In these cases, a BottomSheet rendered from the normal React tree may
 * appear *behind* the modal screen, even when using portals.
 *
 * `FullWindowOverlay` mounts the sheet at the top-most native window
 * layer, ensuring it renders above modal screens and other overlays.
 *
 * *** When to use ***
 *
 * Use this container when your app:
 * - uses `react-native-screens`
 * - presents modal routes using native presentation styles
 * - needs BottomSheets to appear above those modal screens
 *
 * *** How to enable ***
 *
 * Pass this component as the `containerComponent` option:
 *
 * 1. Configure it globally via `BottomSheetModalProvider` `defaultOptions`.
 *
 * 2. Enable per instance via showBottomSheet()
 * ```ts
 * showBottomSheet({
 *   render: () => <MySheet />,
 *   options: {
 *     containerComponent: BottomSheetFullScreenContainer
 *   }
 * });
 * ```
 */

import { ReactNode } from 'react';
import { FullWindowOverlay } from 'react-native-screens';

type TProps = {
  children?: ReactNode;
};

export function BottomSheetFullScreenContainer(props: TProps) {
  const { children } = props;

  return <FullWindowOverlay>{children}</FullWindowOverlay>;
}
