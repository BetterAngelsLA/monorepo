import '@testing-library/jest-native/extend-expect';

// Mock native modules that crash in Node.js environment
jest.mock('@preeternal/react-native-cookie-manager', () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
    set: jest.fn(),
    clearAll: jest.fn(),
    setFromResponse: jest.fn(),
  },
}));

jest.mock('react-native-mmkv', () => ({
  MMKV: jest.fn(() => ({
    getString: jest.fn(),
    set: jest.fn(),
    delete: jest.fn(),
    clearAll: jest.fn(),
    getAllKeys: jest.fn(() => []),
  })),
  createMMKV: jest.fn(() => ({
    getString: jest.fn(),
    set: jest.fn(),
    delete: jest.fn(),
    clearAll: jest.fn(),
    getAllKeys: jest.fn(() => []),
  })),
}));

// Mock native modules that crash in Jest Node.js environment
jest.mock('@preeternal/react-native-cookie-manager');
jest.mock('react-native-mmkv');
