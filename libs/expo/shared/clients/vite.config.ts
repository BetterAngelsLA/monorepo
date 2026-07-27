import path from 'path';
import { mergeConfig } from 'vitest/config';
import { baseVitestConfig } from '../../../../tools/vite/vitest-base';
import { monorepoTsconfigAliases } from '../../../../tools/vite/monorepo-aliases';

const workspaceRoot = path.resolve(__dirname, '../../../..');

export default mergeConfig(baseVitestConfig, {
  resolve: { alias: monorepoTsconfigAliases(workspaceRoot) },
});
