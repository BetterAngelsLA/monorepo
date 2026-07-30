// Stub ErrorUtils global before any module imports from 'expo'.
// expo's Expo.fx.tsx accesses this at import time. vitest-native's
// native engine doesn't expose RN globals during setup file execution,
// and importing 'react-native' fails because the Flow transform isn't
// active yet. Using vi.fn() avoids empty-function lint violations.
import { vi } from 'vitest';

(globalThis as Record<string, unknown>).ErrorUtils = {
  setGlobalHandler: vi.fn(),
  getGlobalHandler: vi.fn(() => () => {}),
  reportFatalError: vi.fn((e: Error) => { throw e; }),
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

vi.mock('@react-native-async-storage/async-storage', () => ({
  __esModule: true,
  default: {
    getItem: vi.fn(() => Promise.resolve(null)),
    setItem: vi.fn(() => Promise.resolve()),
    removeItem: vi.fn(() => Promise.resolve()),
    clear: vi.fn(() => Promise.resolve()),
  },
}));

vi.mock('react-native-mmkv', () => ({
  MMKV: vi.fn(() => ({
    getString: vi.fn(),
    set: vi.fn(),
    delete: vi.fn(),
    clearAll: vi.fn(),
    getAllKeys: vi.fn(() => []),
  })),
  createMMKV: vi.fn(() => ({
    getString: vi.fn(),
    set: vi.fn(),
    delete: vi.fn(),
    clearAll: vi.fn(),
    getAllKeys: vi.fn(() => []),
  })),
}));

// Mock native modules that crash in Jest Node.js environment
vi.mock('@preeternal/react-native-cookie-manager');
vi.mock('react-native-mmkv');
