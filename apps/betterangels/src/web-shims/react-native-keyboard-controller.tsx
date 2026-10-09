/**
 * Web shim for `react-native-keyboard-controller`, wired in through
 * `metro.config.js`.
 *
 * That library exists to solve *native* keyboard problems: insets, dismissal,
 * and the iOS/Android input-accessory toolbar. A browser handles all of that
 * natively, so nothing here needs an equivalent — the shim exists purely so the
 * package can be imported on web, where its TurboModule-backed views
 * (`KeyboardControllerView` et al.) cannot be created.
 *
 * `KeyboardAwareScrollView` degrades to a plain `ScrollView`; the keyboard
 * props are accepted and dropped. `KeyboardProvider` / `KeyboardToolbar`
 * become pass-throughs.
 */
import { forwardRef, type ReactNode } from 'react';
import { ScrollView, type ScrollViewProps } from 'react-native';

type TKeyboardAwareScrollViewProps = ScrollViewProps & {
  /** Native-only: how far above the keyboard to keep the focused input. */
  bottomOffset?: number;
  /** Native-only: extra space reserved for the keyboard toolbar. */
  extraKeyboardSpace?: number;
};

export const KeyboardAwareScrollView = forwardRef<
  ScrollView,
  TKeyboardAwareScrollViewProps
>(function KeyboardAwareScrollView(
  { bottomOffset: _bottomOffset, extraKeyboardSpace: _extra, ...props },
  ref,
) {
  return <ScrollView ref={ref} {...props} />;
});

export type KeyboardAwareScrollViewRef = ScrollView;

export function KeyboardProvider({ children }: { children: ReactNode }) {
  return <>{children}</>;
}

function KeyboardToolbarDone() {
  return null;
}

function KeyboardToolbarRoot({
  children: _children,
}: {
  children?: ReactNode;
}) {
  // The toolbar is a native input accessory; browsers have no equivalent.
  return null;
}

export const KeyboardToolbar = Object.assign(KeyboardToolbarRoot, {
  Done: KeyboardToolbarDone,
});

type TKeyboardEventSubscription = { remove: () => void };

/**
 * `KeyboardEvents` is a native event emitter. There is no web keyboard to
 * track, so subscriptions are inert but must still satisfy the `{ remove() }`
 * contract that callers rely on for cleanup.
 */
export const KeyboardEvents = {
  addListener(
    _eventName: string,
    _listener: () => void,
  ): TKeyboardEventSubscription {
    return { remove: () => undefined };
  },
};
