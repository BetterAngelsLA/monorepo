import path from 'path';
import { vitestConfig } from '../../../tools/vite/vitest-base';
import { monorepoTsconfigAliases } from '../../../tools/vite/monorepo-aliases';
export default vitestConfig({
  resolve: { alias: monorepoTsconfigAliases(path.resolve(__dirname, '../../..')) },
  test: { environment: 'jsdom' },
});
