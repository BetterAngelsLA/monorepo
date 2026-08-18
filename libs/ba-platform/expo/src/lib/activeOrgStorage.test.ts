/* eslint-disable import/first */

/**
 * The MMKV handle is created on first use, not at module scope, so that
 * importing this module does not touch the native module. Nothing else asserts
 * that, and inlining the handle would go unnoticed.
 */
// Hoisted so they exist before the mock factory runs, which lets the first
// test fail on its assertion rather than on a temporal-dead-zone error.
const { created, mockMmkv } = vi.hoisted(() => ({
  created: [] as unknown[],
  mockMmkv: {} as Record<string, string>,
}));

vi.mock('react-native-mmkv', () => ({
  createMMKV: (config?: unknown) => {
    created.push(config);
    return {
      getString: (key: string) => mockMmkv[key],
      set: (key: string, value: string) => {
        mockMmkv[key] = value;
      },
      remove: (key: string) => {
        delete mockMmkv[key];
      },
    };
  },
}));

import { expoActiveOrgStorage } from './activeOrgStorage';

describe('expoActiveOrgStorage', () => {
  it('does not create the MMKV handle just by being imported', () => {
    expect(created).toHaveLength(0);
  });

  it('creates the handle on first use, once, on the default instance', () => {
    expoActiveOrgStorage.get();
    expoActiveOrgStorage.set('org-1');
    expoActiveOrgStorage.get();

    // No configuration: MMKV's default instance is the app-wide one.
    expect(created).toEqual([undefined]);
  });

  it('round-trips through the key both platforms share', () => {
    expoActiveOrgStorage.set('org-2');

    expect(mockMmkv['betterangels_active_org_id']).toBe('org-2');
    expect(expoActiveOrgStorage.get()).toBe('org-2');
  });

  it('reads null when nothing is stored', () => {
    expoActiveOrgStorage.set(null);

    expect(expoActiveOrgStorage.get()).toBeNull();
  });
});
