import { useIsFocused } from 'expo-router/build/useIsFocused';

/** The only throw the guard below is allowed to absorb. */
const NO_NAVIGATION = "Couldn't find a navigation object";

/**
 * Whether the screen rendering this component is the one on screen.
 *
 * Two deliberate choices, one about testability and one about having no router:
 *
 * 1. Imported from `expo-router/build/useIsFocused`, not from `expo-router`.
 *    Importing the package root evaluates the vendored React Navigation elements
 *    barrel, and its asset requires —
 *    `require("../../../assets/react-navigation/elements/back-icon.png")` and four
 *    siblings at `build/react-navigation/elements/index.js:21-25` — make
 *    vitest-native synthesise an ESM asset module that does
 *    `import { createRequire } from "node:module"`. Vitest's vm module evaluator
 *    cannot link that, and Node reports it as:
 *
 *      Error: request for 'node:module' is from a module not been linked
 *
 *    The stack blames `expo-router/src/**`, which is a source-map artefact — that
 *    directory is not even shipped. Only the root barrel reaches those assets, so
 *    it is what makes a module importing `expo-router` unloadable in a spec; this
 *    deep path has no asset requires, and loads. It is a private path (see
 *    `useScreenFocused.spec.tsx`, which fails by name if it moves).
 *
 * 2. The call is guarded. `useIsFocused` reaches `useNavigation`, which throws when
 *    there is no navigation container — every app screen has one, a unit test
 *    rendering a screen does not. Withholding paging exists to stop a *covered*
 *    list paging, and a captured test has no navigation state at all, so defaulting
 *    to focused is the honest answer rather than a test-only branch: nothing is
 *    known to be covering the list.
 *
 *    The catch is narrowed to that one message on purpose. A bare `catch` would
 *    turn every future failure — including a React invariant error raised from
 *    inside the hook — into "focused", i.e. silently back into the uncovered list
 *    this gate exists to prevent, with nothing in the logs. Every other error is
 *    rethrown.
 */
export function useScreenFocused(): boolean {
  try {
    return useIsFocused();
  } catch (error) {
    if (error instanceof Error && error.message.includes(NO_NAVIGATION)) {
      return true;
    }

    throw error;
  }
}
