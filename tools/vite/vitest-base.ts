import { defineConfig } from 'vitest/config';

/**
 * Shared vitest base config for library projects.
 *
 * Usage in per-project vite.config.ts:
 *   import { defineConfig, mergeConfig } from 'vitest/config';
 *   import { baseVitestConfig } from '../../tools/vite/vitest-base';
 *   export default mergeConfig(baseVitestConfig, { test: { environment: 'jsdom' }, ... });
 */
export const baseVitestConfig = defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
  },
});
