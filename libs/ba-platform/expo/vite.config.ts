import path from 'path';
import { mergeConfig } from 'vitest/config';
import { baseVitestConfig } from '../../../libs/vitest-config/src/index';
import { monorepoTsconfigAliases } from '../../../libs/vitest-config/src/index';
export default mergeConfig(baseVitestConfig, {
  resolve: { alias: monorepoTsconfigAliases(path.resolve(__dirname, '../../..')) },
});
