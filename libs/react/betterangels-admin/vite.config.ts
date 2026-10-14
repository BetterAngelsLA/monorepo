import path from 'path';
import { mergeConfig } from 'vitest/config';
import {
  baseVitestConfig,
  monorepoTsconfigAliases,
  svgTestResolver,
} from '../../../libs/vite-utils/src/index';

const WORKSPACE_ROOT = path.resolve(__dirname, '../../..');

export default mergeConfig(baseVitestConfig, {
  plugins: process.env.VITEST ? [svgTestResolver()] : [],
  resolve: {
    alias: monorepoTsconfigAliases(WORKSPACE_ROOT),
  },
  test: { environment: 'jsdom' },
});
