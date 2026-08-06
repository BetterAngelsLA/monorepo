/// <reference types='vitest' />
import { reactNative } from 'vitest-native';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [reactNative()],
  resolve: { tsconfigPaths: true },
  test: {
    globals: true,
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
    passWithNoTests: true,
  },
});
