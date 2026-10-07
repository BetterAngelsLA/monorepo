// NOTE: keep this file free of imports that need the React Native transform.
// `setupFiles` run outside that pipeline, so a static `import` of
// '@testing-library/react-native/build/matchers/extend-expect' here fails every
// spec with "SyntaxError: Unexpected token 'typeof'" — which is why the matcher
// import stays in the individual spec files in this project. For the same
// reason the ErrorUtils stub below must be assigned before anything imports
// 'expo', and it is load-bearing: removing it fails 24 of the 42 spec files.
//
// @react-native-async-storage/async-storage and react-native-safe-area-context
// are not mocked here: vitest-native auto-mocks both (see its "Auto-Detect
// Presets"). Specs that assert on async-storage persistence still supply their
// own stateful factory. react-native-mmkv and the cookie manager have no
// preset, so their no-op mocks below stay.
//
// Stub ErrorUtils global before any module imports from 'expo'.
// expo's Expo.fx.tsx accesses this at import time. vitest-native's
// native engine doesn't expose RN globals during setup file execution,
// and importing 'react-native' fails because the Flow transform isn't
// active yet. Using vi.fn() avoids empty-function lint violations.
import { vi } from 'vitest';

(globalThis as Record<string, unknown>).ErrorUtils = {
  setGlobalHandler: vi.fn(),
  getGlobalHandler: vi.fn(() => vi.fn()),
  reportFatalError: vi.fn((e: Error) => {
    throw e;
  }),
};
vi.mock('@preeternal/react-native-cookie-manager', () => ({
  __esModule: true,
  default: {
    get: vi.fn(),
    set: vi.fn(),
    clearAll: vi.fn(),
    setFromResponse: vi.fn(),
  },
}));

// Basic no-op react-native-mmkv v4 surface: `remove` (not the v2/v3 `delete`)
// is what createPersistentSynchronousStorage calls. Suites that assert on
// persistence supply their own stateful factory.
vi.mock('react-native-mmkv', () => ({
  MMKV: vi.fn(() => ({
    getString: vi.fn(),
    set: vi.fn(),
    remove: vi.fn(),
    clearAll: vi.fn(),
    getAllKeys: vi.fn(() => []),
  })),
  createMMKV: vi.fn(() => ({
    getString: vi.fn(),
    set: vi.fn(),
    remove: vi.fn(),
    clearAll: vi.fn(),
    getAllKeys: vi.fn(() => []),
  })),
}));

// NOTE: a bare `vi.mock('<module>')` after a factory for the same module
// replaces the factory with an automock — that is why the MMKV and
// cookie-manager duplicates were removed.
