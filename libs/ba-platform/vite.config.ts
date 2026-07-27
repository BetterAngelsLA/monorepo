import { mergeConfig } from 'vitest/config';
import { baseVitestConfig } from '../../tools/vite/vitest-base';
export default mergeConfig(baseVitestConfig, { test: { testPathIgnorePatterns: ['/web/', '/expo/'] } });
