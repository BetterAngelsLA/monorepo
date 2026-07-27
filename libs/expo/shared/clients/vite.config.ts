import path from 'path';
import { mergeConfig } from 'vitest/config';
import { baseVitestConfig } from '../../../../libs/vitest-config/src/index';
import { monorepoTsconfigAliases } from '../../../../libs/vitest-config/src/index';

const workspaceRoot = path.resolve(__dirname, '../../../..');

export default mergeConfig(baseVitestConfig, {
  resolve: { alias: monorepoTsconfigAliases(workspaceRoot) },
});
