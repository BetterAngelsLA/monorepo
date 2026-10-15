import path from 'node:path';
import { mergeConfig } from 'vitest/config';
import {
  baseVitestConfig,
  monorepoTsconfigAliases,
} from '../../libs/vite-utils/src/index';

const WORKSPACE_ROOT = path.resolve(__dirname, '../..');

export default mergeConfig(baseVitestConfig, {
  test: { environment: 'jsdom' },
  resolve: { alias: monorepoTsconfigAliases(WORKSPACE_ROOT) },
});
