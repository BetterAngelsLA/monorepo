import path from 'node:path';
import { mergeConfig } from 'vitest/config';
import {
  baseVitestConfig,
  monorepoTsconfigAliases,
} from '../../../libs/vite-utils/src/index';

export default mergeConfig(baseVitestConfig, {
  resolve: {
    // `tsconfigPaths` alone does not resolve @monorepo/* from *test* files here
    // (it works for source), so tests could not import sibling libs. Explicit
    // aliases are the mechanism Rolldown respects — see monorepo-aliases.ts.
    alias: monorepoTsconfigAliases(path.resolve(__dirname, '../../..')),
    tsconfigPaths: true,
  },
  test: { environment: 'jsdom' },
});
