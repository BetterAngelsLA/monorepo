import { defineConfig } from 'vitest/config';

export const baseVitestConfig = defineConfig({
  test: {
    globals: true,
    environment: 'node' as const,
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
    passWithNoTests: true,
  },
});
export { monorepoTsconfigAliases } from './monorepo-aliases';
export { rawSvgPlugin } from './raw-svg-plugin';
export { svgTestResolverIfVitest } from './svg-test-resolver';
