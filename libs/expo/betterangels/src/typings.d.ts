/**
 * Ambient declarations for this project.
 *
 * Why the vitest block below exists: @testing-library/react-native registers
 * its matchers at runtime (importing '.../build/matchers/extend-expect' from a
 * spec or setup file), and for types it augments Jest's `Matchers` and
 * `@jest/expect` only. That used to cover vitest as well, because vitest's
 * `JestAssertion` extended the global `jest.Matchers`. Vitest 5 declares its
 * own `JestAssertion` next to an otherwise empty `Matchers<R, T>`, which is
 * vitest's documented hook for custom matchers
 * (https://vitest.dev/guide/extending-matchers). Attaching the RNTL matchers
 * there is what keeps `toBeOnTheScreen()` and friends on `expect()`.
 */
import 'vitest';
import type { JestNativeMatchers } from '@testing-library/react-native/build/matchers/types';

declare module 'vitest' {
  interface Matchers<R, T> extends JestNativeMatchers<R> {}
}
