/// <reference types='vitest' />
import path from 'path';
import { reactNative } from 'vitest-native';
import { jestCompatAliases } from 'vitest-native/jest-compat';
import { defineConfig } from 'vitest/config';
import { monorepoTsconfigAliases } from '../../../tools/vite/monorepo-aliases';

const workspaceRoot = path.resolve(__dirname, '../../..');

export default defineConfig({
  plugins: [reactNative()],
  resolve: { alias: { ...monorepoTsconfigAliases(workspaceRoot), ...jestCompatAliases() } },
  test: {
    globals: true,
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
  },
});
