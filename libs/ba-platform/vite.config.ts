import { vitestConfig } from '../../tools/vite/vitest-base';
export default vitestConfig({ test: { testPathIgnorePatterns: ['/web/', '/expo/'] } });
