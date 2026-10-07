/// <reference types='vitest' />
import path from 'path';
import { reactNative } from 'vitest-native';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [reactNative()],
  resolve: {
    // These expo modules are redirected at the bundler level rather than mocked
    // with `vi.mock()` in test-setup.ts: vitest-native's native engine loads
    // them through its own require registry, where a setup-file mock does not
    // intercept. Dropping an alias here makes the real module load and takes
    // down 24 of the 42 spec files at import time (the real expo-file-system
    // throws "p.replace is not a function"). App-source-only modules can still
    // be mocked in test-setup.ts.
    alias: [
      {
        find: /^expo-file-system(?:\/.*)?$/,
        replacement: path.resolve(
          __dirname,
          'src/__mocks__/expo-file-system.ts',
        ),
      },
      {
        find: /^expo-image(?:\/.*)?$/,
        replacement: path.resolve(__dirname, 'src/__mocks__/expo-image.tsx'),
      },
      {
        find: /^expo-modules-core(?:\/.*)?$/,
        replacement: path.resolve(
          __dirname,
          'src/__mocks__/expo-modules-core.ts',
        ),
      },
    ],
    tsconfigPaths: true,
  },
  test: {
    globals: true,
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
    setupFiles: ['./test-setup.ts'],
  },
});
