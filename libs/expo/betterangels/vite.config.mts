/// <reference types='vitest' />
import { monorepoTsconfigAliases } from '@monorepo/vitest-config';
import path from 'path';
import { reactNative } from 'vitest-native';
import { defineConfig } from 'vitest/config';

const workspaceRoot = path.resolve(__dirname, '../../..');

export default defineConfig({
  plugins: [reactNative()],
  resolve: { alias: monorepoTsconfigAliases(workspaceRoot) },
  test: {
    globals: true,
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
  },
});
