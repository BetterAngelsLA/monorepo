/// <reference types='vitest' />
import { reactNative } from 'vitest-native';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [
    reactNative({
      transform: ['sanitize-html', 'htmlparser2'],
      hotRuntime: false,
    }),
  ],
  test: {
    globals: true,
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
  },
});
