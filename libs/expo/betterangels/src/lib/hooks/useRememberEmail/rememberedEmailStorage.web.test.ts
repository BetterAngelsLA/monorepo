import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  clearRememberedEmail,
  loadRememberedEmail,
  saveRememberedEmail,
} from './rememberedEmailStorage.web';

function installLocalStorage(initial: Record<string, string> = {}) {
  const store = new Map(Object.entries(initial));
  vi.stubGlobal('window', {
    localStorage: {
      getItem: (key: string) => store.get(key) ?? null,
      setItem: (key: string, value: string) => {
        store.set(key, value);
      },
      removeItem: (key: string) => {
        store.delete(key);
      },
    },
  });
  return store;
}

afterEach(() => vi.unstubAllGlobals());

describe('rememberedEmailStorage (web)', () => {
  it('stores the logical key under the ba.rememberedEmail. prefix', async () => {
    const store = installLocalStorage({
      'ba.rememberedEmail.non-hmis.email': 'saved@example.com',
    });

    await expect(loadRememberedEmail('non-hmis.email')).resolves.toBe(
      'saved@example.com',
    );
    expect(store.has('non-hmis.email')).toBe(false);

    await saveRememberedEmail('non-hmis.email', 'next@example.com');
    expect(store.get('ba.rememberedEmail.non-hmis.email')).toBe(
      'next@example.com',
    );

    await clearRememberedEmail('non-hmis.email');
    expect(store.has('ba.rememberedEmail.non-hmis.email')).toBe(false);
  });
});
