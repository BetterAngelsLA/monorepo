/**
 * The app's keyboard surface — the **native** build.
 *
 * A seam over `react-native-keyboard-controller` so the web build can resolve
 * `Keyboard.web.tsx` beside it: the package is unusable on web, and a bundler
 * alias would hide that at the import site. The trade is that this file has to be
 * kept in step with the library by hand, so a root `no-restricted-imports` rule
 * stops anything importing the package directly.
 *
 * This half adds nothing — it re-exports, so native behaviour is byte-identical.
 * Types stay precise on both platforms, because TypeScript always resolves *this*
 * file.
 *
 * `KeyboardAwareScrollView` is re-exported as `RNKeyboardAwareScrollView` to
 * avoid colliding with the styled `KeyboardAwareScrollView` wrapper from
 * `../KeyboardAwareScrollView`, which is what most screens should use.
 */
/* eslint-disable no-restricted-imports -- this module *is* the seam; everything
   else in the repo must import the keyboard surface from here. */
export {
  KeyboardAwareScrollView as RNKeyboardAwareScrollView,
  KeyboardEvents,
  KeyboardProvider,
  KeyboardToolbar,
} from 'react-native-keyboard-controller';

export type { KeyboardAwareScrollViewRef } from 'react-native-keyboard-controller';
