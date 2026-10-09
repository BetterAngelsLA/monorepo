/// <reference types='vitest' />
import svgr from 'vite-plugin-svgr';
import { reactNative } from 'vitest-native';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [
    reactNative({
      transform: ['sanitize-html', 'htmlparser2'],
      hotRuntime: false,
    }),
    svgr({
      include: '**/*.svg',
      svgrOptions: { exportType: 'default', native: true },
    }),
  ],
  test: {
    globals: true,
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
    passWithNoTests: true,
  },
});
