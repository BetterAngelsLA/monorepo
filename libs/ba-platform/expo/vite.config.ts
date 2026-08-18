import path from 'node:path';
import { mergeConfig } from 'vitest/config';
import {
  baseVitestConfig,
  monorepoTsconfigAliases,
} from '../../../libs/vite-utils/src/index';

export default mergeConfig(baseVitestConfig, {
  resolve: {
    // `tsconfigPaths` resolves @monorepo/* from source but not from test files
    // here; explicit aliases are what Rolldown respects. See monorepo-aliases.ts.
    alias: monorepoTsconfigAliases(path.resolve(__dirname, '../../..')),
    tsconfigPaths: true,
  },
});
