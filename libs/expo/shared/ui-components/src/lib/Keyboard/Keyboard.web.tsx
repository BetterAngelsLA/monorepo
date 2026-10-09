/**
 * The app's keyboard surface — the **web** build. Counterpart of `Keyboard.tsx`.
 *
 * `react-native-keyboard-controller` is not usable on web, and not for the
 * obvious reason. It *does* ship a non-native `bindings.ts` — native views cast
 * to plain `View`, the native module replaced by NOOPs, `reanimated.ts` handlers
 * stubbed — so **importing** it is safe. **Using** it is not: with the package's
 * own fallback, `KeyboardAwareScrollView` resolves to `undefined` and the
 * sign-in screen lands in the error boundary. Measured on the running web app:
 *
 *   Error: Element type is invalid: expected a string (for built-in components)
 *   or a class/function … but got: undefined. … Check the render method of
 *   `SignInContainer`.
 *
 * Its toolbar also mounts a 42px "Done" bar — off-screen at the bottom, but real
 * DOM. A browser needs none of this: it scrolls the focused input into view
 * itself and has no input-accessory bar. So the web half degrades to what the
 * browser already does, and no part of the package enters the web bundle.
 *
 * Every export mirrors `Keyboard.tsx` one-for-one; keep them in step.
 */
import { forwardRef, type ReactNode } from 'react';
import { ScrollView, type ScrollViewProps } from 'react-native';

type TKeyboardAwareScrollViewProps = ScrollViewProps & {
  /** Native-only: how far above the keyboard to keep the focused input. */
  bottomOffset?: number;
  /** Native-only: extra space reserved for the keyboard toolbar. */
  extraKeyboardSpace?: number;
};

/** `KeyboardAwareScrollView` degrades to a plain `ScrollView`. */
export const RNKeyboardAwareScrollView = forwardRef<
  ScrollView,
  TKeyboardAwareScrollViewProps
>(function RNKeyboardAwareScrollView(
  { bottomOffset: _bottomOffset, extraKeyboardSpace: _extra, ...props },
  ref,
) {
  return <ScrollView ref={ref} {...props} />;
});

/**
 * The native ref additionally exposes `assureFocusedInputVisible`; a browser
 * scrolls to the focused field on its own. Nothing in the app calls it, so a
 * plain `ScrollView` ref satisfies the same call sites.
 */
export type KeyboardAwareScrollViewRef = ScrollView;

/** No native keyboard module to install, so this is a pass-through. */
export function KeyboardProvider({ children }: { children?: ReactNode }) {
  return <>{children}</>;
}

function KeyboardToolbarDone() {
  return null;
}

function KeyboardToolbarRoot({
  children: _children,
  insets: _insets,
}: {
  children?: ReactNode;
  insets?: unknown;
}) {
  // The toolbar is a native input accessory; browsers have no equivalent.
  return null;
}

export const KeyboardToolbar = Object.assign(KeyboardToolbarRoot, {
  Done: KeyboardToolbarDone,
});

type TKeyboardEventSubscription = { remove: () => void };

/**
 * `KeyboardEvents` is a native event emitter. There is no web keyboard to track,
 * so subscriptions are inert but must still satisfy the `{ remove() }` contract
 * callers rely on for cleanup.
 */
export const KeyboardEvents = {
  addListener(
    _eventName: string,
    _listener: () => void,
  ): TKeyboardEventSubscription {
    return { remove: () => undefined };
  },
};
