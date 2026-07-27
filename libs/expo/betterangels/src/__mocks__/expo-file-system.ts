// Shim: expo-file-system → prevents native-engine eager-load failures.
// The real package imports native values that are null in test, so we
// provide safe defaults.  This is only loaded by vitest via resolve.alias.

// Stub the ErrorUtils global that expo-modules-core internals expect.
// These are intentionally no-ops — they only exist to satisfy module loading.
(globalThis as Record<string, unknown>).ErrorUtils ??= {
  setGlobalHandler: () => {
    // no-op: satisfies expo-modules-core's import-time side effects
  },
  getGlobalHandler: () => () => {
    // no-op: returns a no-op handler
  },
  reportFatalError: (e: Error) => {
    throw e;
  },
};

const docDir = '/mock/documentDirectory/';
const cacheDir = '/mock/cacheDirectory/';

const FileSystem = {
  documentDirectory: docDir,
  cacheDirectory: cacheDir,
  bundleDirectory: '/mock/bundleDirectory/',
  readAsStringAsync: () => Promise.resolve(''),
  writeAsStringAsync: () => Promise.resolve(),
  deleteAsync: () => Promise.resolve(),
  makeDirectoryAsync: () => Promise.resolve(),
  getInfoAsync: () => Promise.resolve({ exists: false, isDirectory: false }),
  readDirectoryAsync: () => Promise.resolve([]),
  downloadAsync: () => Promise.resolve({ uri: '' }),
  createDownloadResumable: () => ({}),
  networkAvailable: true,
  EncodingType: { UTF8: 'utf8', Base64: 'base64' },
  StorageAccessFramework: {} as Record<string, unknown>,
  getTotalDiskCapacityAsync: () => Promise.resolve(0),
  getFreeDiskStorageAsync: () => Promise.resolve(0),
};

export default FileSystem;
export const {
  documentDirectory,
  cacheDirectory,
  bundleDirectory,
  readAsStringAsync,
  writeAsStringAsync,
  deleteAsync,
  makeDirectoryAsync,
  getInfoAsync,
  readDirectoryAsync,
  downloadAsync,
  createDownloadResumable,
  networkAvailable,
  EncodingType,
  StorageAccessFramework,
  getTotalDiskCapacityAsync,
  getFreeDiskStorageAsync,
} = FileSystem;
