import { mergeConfig } from 'vitest/config';
import { baseVitestConfig } from '../../tools/vite/vitest-base';

// Parent project — exclude sub-project test dirs (web/, expo/) which have
// their own vitest configs. Jest equivalent: testPathIgnorePatterns.
export default mergeConfig(baseVitestConfig, {
  test: { exclude: ['web/**', 'expo/**'] },
});
