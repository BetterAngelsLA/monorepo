/// <reference types='vitest' />
import path from 'path';
import { reactNative } from 'vitest-native';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [reactNative()],
  resolve: {
    alias: [
      {
        find: /^expo-file-system(?:\/.*)?$/,
        replacement: path.resolve(
          __dirname,
          'src/__mocks__/expo-file-system.ts',
        ),
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
  },
});
