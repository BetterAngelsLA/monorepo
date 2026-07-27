import path from 'path';
import { mergeConfig } from 'vitest/config';
import { baseVitestConfig } from '@monorepo/vitest-config';
import { monorepoTsconfigAliases } from '@monorepo/vitest-config';
export default mergeConfig(baseVitestConfig, {
  resolve: { alias: monorepoTsconfigAliases(path.resolve(__dirname, '../../..')) },
});
