import { beforeEach, describe, expect, it, vi } from 'vitest';
import { buildPolicyConfig } from './buildPolicyConfig';

describe('buildPolicyConfig', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('builds an object from key/buildFn pairs', () => {
    const config = buildPolicyConfig([
      { key: 'a', buildFn: () => ({ foo: 1 }) },
      { key: 'b', buildFn: () => ({ bar: 2 }) },
    ] as const);

    expect(config).toEqual({
      a: { foo: 1 },
      b: { bar: 2 },
    });
  });

  it('logs a warning for duplicate keys in non-production', () => {
    const spy = vi.spyOn(console, 'warn').mockImplementation(vi.fn());

    buildPolicyConfig([
      { key: 'dup', buildFn: () => ({ one: 1 }) },
      { key: 'dup', buildFn: () => ({ two: 2 }) },
    ] as const);

    expect(spy).toHaveBeenCalledWith(
      '[apollo buildPolicyConfig] Duplicate key "dup" – later one will override.'
    );
  });
});
