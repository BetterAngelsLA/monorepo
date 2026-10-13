/**
 * The app's keyboard surface — the native build. A seam over
 * `react-native-keyboard-controller` so the web build can resolve
 * `Keyboard.web.tsx` beside it; a bundler alias would hide the split at the
 * import site. Re-exported by hand, so keep it in step with the library, and a
 * root `no-restricted-imports` rule stops direct imports.
 *
 * `RNKeyboardAwareScrollView` avoids colliding with the styled
 * `KeyboardAwareScrollView` from `../KeyboardAwareScrollView`.
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
