/// <reference types='vitest' />
import path from 'path';
import { reactNative } from 'vitest-native';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [
    reactNative({
      transform: ['sanitize-html', 'htmlparser2'],
      hotRuntime: false,
    }),
  ],
  resolve: {
    // These expo modules are redirected at the bundler level rather than mocked
    // with `vi.mock()` in test-setup.ts: vitest-native's native engine loads
    // them through its own require registry, where a setup-file mock does not
    // intercept. Dropping an alias here makes the real module load and takes
    // down 24 of the 42 spec files at import time (the real expo-file-system
    // throws "p.replace is not a function"). expo-image is only reached from
    // app source, so `vi.mock()` would work for it, but the aliases keep the
    // trio on one mechanism and the regex also covers subpath imports.
    alias: [
      {
        find: /^expo-file-system(?:\/.*)?$/,
        replacement: path.resolve(
          import.meta.dirname,
          'src/__mocks__/expo-file-system.ts',
        ),
      },
      {
        // tslib's `exports` map sends ESM imports to its CommonJS wrapper
        // (modules/index.js), whose `import tslib from '../tslib.js'` default
        // import resolves to undefined under the native engine — every consumer
        // then throws "Cannot read properties of undefined (reading
        // '__extends')". Point both resolvers at the real ESM build.
        find: /^tslib$/,
        replacement: path.resolve(
          import.meta.dirname,
          '../../../node_modules/tslib/tslib.es6.mjs',
        ),
      },
      {
        find: /^expo-image(?:\/.*)?$/,
        replacement: path.resolve(
          import.meta.dirname,
          'src/__mocks__/expo-image.tsx',
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
