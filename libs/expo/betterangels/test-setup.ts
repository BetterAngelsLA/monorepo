import '@testing-library/react-native/build/matchers/extend-expect';
import { vi } from 'vitest';

// Mock native modules that crash in Node.js environment
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
