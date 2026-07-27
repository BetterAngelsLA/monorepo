/// <reference types='vitest' />
import path from 'path';
import { reactNative } from 'vitest-native';
import { defineConfig } from 'vitest/config';
import { monorepoTsconfigAliases } from '../../../../tools/vite/monorepo-aliases';

const workspaceRoot = path.resolve(__dirname, '../../../..');

export default defineConfig({
  plugins: [reactNative()],
  resolve: { alias: monorepoTsconfigAliases(workspaceRoot) },
  test: {
    globals: true,
    include: ['src/**/*.test.ts'],
  },
});
