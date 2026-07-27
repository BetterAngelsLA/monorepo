import path from 'path';
import { mergeConfig } from 'vitest/config';
import { baseVitestConfig } from '@monorepo/vitest-config';
import { monorepoTsconfigAliases } from '@monorepo/vitest-config';

const workspaceRoot = path.resolve(__dirname, '../../../..');

export default mergeConfig(baseVitestConfig, {
  resolve: { alias: monorepoTsconfigAliases(workspaceRoot) },
});
