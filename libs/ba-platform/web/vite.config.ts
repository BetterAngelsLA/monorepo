import path from 'path';
import { mergeConfig } from 'vitest/config';
import { baseVitestConfig } from '../../../tools/vite/vitest-base';
import { monorepoTsconfigAliases } from '../../../tools/vite/monorepo-aliases';
export default mergeConfig(baseVitestConfig, {
  resolve: { alias: monorepoTsconfigAliases(path.resolve(__dirname, '../../..')) },
  test: { environment: 'jsdom' },
});
