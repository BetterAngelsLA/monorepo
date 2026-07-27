import { defineConfig } from 'vitest/config';

export const baseVitestConfig = defineConfig({
  test: {
    globals: true,
    environment: 'node' as const,
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
  },
});
export { monorepoTsconfigAliases } from './monorepo-aliases';
