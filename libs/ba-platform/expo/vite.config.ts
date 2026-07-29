import { mergeConfig } from 'vitest/config';
import { baseVitestConfig } from '../../../libs/vite-utils/src/index';
export default mergeConfig(baseVitestConfig, {
  resolve: { tsconfigPaths: true },
});
