import path from 'path';
import { defineConfig, UserConfig } from 'vitest/config';

const setupFile = path.resolve(__dirname, 'vitest-setup.ts');

export function vitestConfig(overrides: UserConfig = {}): ReturnType<typeof defineConfig> {
  return defineConfig({
    test: {
      globals: true,
      environment: 'node',
      include: ['src/**/*.test.ts'],
      setupFiles: [setupFile],
    },
    ...overrides,
  });
}
