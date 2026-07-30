const stores: Record<string, Map<string, string>> = {};

function getStore(id?: string): Map<string, string> {
  const key = id ?? 'default';
  if (!stores[key]) {
    stores[key] = new Map<string, string>();
  }
  return stores[key];
}

export const createMMKV = vi.fn((config?: { id?: string }) => {
  const store = getStore(config?.id);
  return {
    set: vi.fn((key: string, value: string) => {
      store.set(key, value);
    }),
    getString: vi.fn((key: string) => {
      return store.has(key) ? store.get(key) : undefined;
    }),
    getNumber: vi.fn(),
    getBoolean: vi.fn(),
    contains: vi.fn((key: string) => store.has(key)),
    delete: vi.fn((key: string) => {
      store.delete(key);
    }),
    clearAll: vi.fn(() => {
      store.clear();
    }),
    remove: vi.fn((key: string) => {
      store.delete(key);
    }),
    getAllKeys: vi.fn(() => Array.from(store.keys())),
  };
});

export const MMKV = vi.fn();
