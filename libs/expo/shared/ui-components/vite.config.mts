/// <reference types='vitest' />
import path from 'path';
import { reactNative } from 'vitest-native';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [
    reactNative({
      transform: [
        'react-native-select-dropdown',
        'sanitize-html',
        'htmlparser2',
      ],
      hotRuntime: false,
    }),
  ],
  resolve: {
    tsconfigPaths: true,
    alias: [
      {
        // tslib's `exports` map sends ESM imports to its CommonJS wrapper
        // (modules/index.js), whose `import tslib from '../tslib.js'` default
        // import resolves to undefined under the native engine — every consumer
        // then throws "Cannot read properties of undefined (reading
        // '__extends')". Point both resolvers at the real ESM build.
        find: /^tslib$/,
        replacement: path.resolve(
          import.meta.dirname,
          '../../../../node_modules/tslib/tslib.es6.mjs',
        ),
      },
    ],
  },
  test: {
    globals: true,
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
  },
});
