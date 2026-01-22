const stores: Record<string, Map<string, string>> = {};

function getStore(id?: string): Map<string, string> {
  const key = id ?? 'default';
  if (!stores[key]) {
    stores[key] = new Map<string, string>();
  }
  return stores[key];
}

export const createMMKV = jest.fn((config?: { id?: string }) => {
  const store = getStore(config?.id);
  return {
    set: jest.fn((key: string, value: string) => {
      store.set(key, value);
    }),
    getString: jest.fn((key: string) => {
      return store.has(key) ? store.get(key) : undefined;
    }),
    getNumber: jest.fn(),
    getBoolean: jest.fn(),
    contains: jest.fn((key: string) => store.has(key)),
    delete: jest.fn((key: string) => {
      store.delete(key);
    }),
    clearAll: jest.fn(() => {
      store.clear();
    }),
    remove: jest.fn((key: string) => {
      store.delete(key);
    }),
    getAllKeys: jest.fn(() => Array.from(store.keys())),
  };
});

export const MMKV = jest.fn();
