import path from 'path';
import { mergeConfig } from 'vitest/config';
import {
  baseVitestConfig,
  monorepoTsconfigAliases,
} from '../../../libs/vite-utils/src/index';

const WORKSPACE_ROOT = path.resolve(__dirname, '../../..');

export default mergeConfig(baseVitestConfig, {
  resolve: {
    alias: monorepoTsconfigAliases(WORKSPACE_ROOT),
  },
});
