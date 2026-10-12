/**
 * Ambient declarations for this project.
 *
 * React Native Testing Library declares its custom matchers (`toBeOnTheScreen`,
 * `toHaveStyle`, `toHaveTextContent`, …) only for Jest — it augments the global
 * `jest` namespace and `@jest/expect`, and neither reaches Vitest's `Assertion`.
 * vitest-native, which runs these tests, ships the missing Vitest-side types as
 * a types-only entry point; referencing it is all that is needed.
 */
/// <reference types="vitest-native/rntl-matchers" />
