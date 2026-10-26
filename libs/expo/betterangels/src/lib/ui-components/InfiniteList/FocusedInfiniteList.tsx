import {
  InfiniteList as InfiniteListBase,
  type TInfiniteListProps,
} from '@monorepo/expo/shared/ui-components';
import { useScreenFocused } from './useScreenFocused';

/**
 * The design system's `InfiniteList` with paging gated on whether the list's own
 * screen is on screen. Every full-screen list in this app renders this, not the
 * design system component directly — the gate has to be impossible to forget,
 * because the bug it fixes was a covered list paging in its whole dataset unnoticed.
 *
 * Why the gate lives here and not in the shared component: the only focus signal
 * available is the router's, and a design system should not require its consumers to
 * have a navigation container. `useIsFocused` reaches `useNavigation`, which throws
 * "Couldn't find a navigation object. Is your component inside NavigationContainer?"
 * when there is none, so reading it inside the design system would make that a
 * requirement of every component in the barrel. The shared list therefore takes
 * `isFocused` as a prop; `useScreenFocused` reads the router here, at the app's edge,
 * and needs no substitution in specs.
 *
 * Caveat: this gates *route-level* occlusion. An in-screen `react-native` `Modal`
 * (`ClientCardModal`, `MainPlusModal`) does not drop focus, so a list under one
 * keeps paging; neither was observed to drain. `MultiSelectInfinite` in the design
 * system renders the shared list directly, so it is ungated too — pass `isFocused`
 * through its `infiniteProps` if a covered picker ever needs gating.
 *
 * Named `FocusedInfiniteList` rather than `InfiniteList` so a call site never has
 * to ask which `InfiniteList` it is holding — this one, or the design system's.
 *
 * No `isFocused` prop: the router decides, so a caller cannot accidentally turn
 * the gate off. That is `Omit`ted from the props rather than merely overwritten,
 * so passing one is a type error instead of being silently ignored. A list that
 * needs a different signal (an in-screen `Modal` that does not drop focus) is a
 * separate problem with a separate solution, not an override on every list.
 */
export function FocusedInfiniteList<T>({
  ...props
}: Omit<TInfiniteListProps<T>, 'isFocused'>) {
  return <InfiniteListBase<T> {...props} isFocused={useScreenFocused()} />;
}
