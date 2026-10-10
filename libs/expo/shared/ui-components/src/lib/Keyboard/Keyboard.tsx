/**
 * The app's keyboard surface — the **native** build.
 *
 * A single deliberate seam over `react-native-keyboard-controller`, so the web
 * build can resolve `Keyboard.web.tsx` beside it. The package has no browser
 * build and no documented web support, and although its non-native `bindings.ts`
 * makes *importing* it safe, its `KeyboardAwareScrollView` is `undefined` on web
 * — see the web half for the measurement.
 *
 * Why a seam rather than a bundler alias: it keeps the substitution visible at
 * the import site, needs no Metro `resolveRequest` hook, and is what the rest of
 * this repo already does for platform-only modules (`clearSessionCookies`,
 * `hmisInterceptors`, `PdfViewer`). The cost is that the seam has to be kept in
 * sync with the library by hand, so a `no-restricted-imports` rule in the root
 * ESLint config stops anything importing the package directly.
 *
 * The native half adds nothing — it is a re-export, so native behaviour is
 * byte-identical to importing the package. Types stay precise for every
 * platform: TypeScript always resolves *this* file, so consumers keep the
 * library's real prop and ref types even where the runtime is the degraded one.
 *
 * `KeyboardAwareScrollView` is re-exported as `RNKeyboardAwareScrollView` to
 * avoid colliding with the styled `KeyboardAwareScrollView` wrapper from
 * `../KeyboardAwareScrollView`, which is the one most screens should use.
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
