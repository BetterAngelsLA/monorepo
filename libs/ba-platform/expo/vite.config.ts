import path from 'node:path';
import { mergeConfig } from 'vitest/config';
import {
  baseVitestConfig,
  monorepoTsconfigAliases,
} from '../../../libs/vite-utils/src/index';

export default mergeConfig(baseVitestConfig, {
  resolve: {
    // See the web config: aliases are needed for @monorepo/* imports from test
    // files, which `tsconfigPaths` does not cover.
    alias: monorepoTsconfigAliases(path.resolve(__dirname, '../../..')),
    tsconfigPaths: true,
  },
});
