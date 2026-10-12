/**
 * The app's keyboard surface — the **web** build. Counterpart of `Keyboard.tsx`.
 *
 * Importing the package is safe (it ships a non-native `bindings.ts`), but using
 * it is not: its own fallback resolves `KeyboardAwareScrollView` to `undefined`,
 * which puts the sign-in screen in the error boundary. A browser needs none of
 * it — it scrolls the focused input into view itself and has no input-accessory
 * bar — so this half degrades to a plain `ScrollView` and no part of the package
 * enters the web bundle.
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
