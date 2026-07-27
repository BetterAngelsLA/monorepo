import { defineConfig, UserConfig } from 'vitest/config';

export function vitestConfig(overrides: UserConfig = {}): ReturnType<typeof defineConfig> {
  const { test: testOverrides, ...otherOverrides } = overrides;
  return defineConfig({
    test: {
      globals: true,
      environment: 'node',
      include: ['src/**/*.test.ts'],
      ...testOverrides,
    },
    ...otherOverrides,
  });
}
