import { mergeConfig } from 'vitest/config';
import { baseVitestConfig } from '../../../libs/vitest-config/src/index';
export default mergeConfig(baseVitestConfig, {
  resolve: { tsconfigPaths: true },
  test: { environment: 'jsdom' },
});
