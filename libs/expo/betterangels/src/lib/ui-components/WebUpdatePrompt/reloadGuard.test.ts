import {
  isReloadGuardActive,
  markReloadAttempt,
  RELOAD_GUARD_KEY,
  RELOAD_GUARD_MS,
} from './reloadGuard';

/**
 * These run under the native test environment, which has no `window` or
 * `sessionStorage` — the same situation as SSR. Installing a small in-memory
 * stand-in keeps the test on the real code path (it reads `globalThis`) and lets
 * the unavailable-storage case be exercised exactly.
 */
const makeStorage = () => {
  const store = new Map<string, string>();

  return {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => void store.set(key, value),
    removeItem: (key: string) => void store.delete(key),
    clear: () => store.clear(),
  };
};

const original = Object.getOwnPropertyDescriptor(globalThis, 'sessionStorage');

const install = (storage: unknown) => {
  Object.defineProperty(globalThis, 'sessionStorage', {
    value: storage,
    configurable: true,
    writable: true,
  });
};

describe('reloadGuard', () => {
  let storage: ReturnType<typeof makeStorage>;

  beforeEach(() => {
    storage = makeStorage();
    install(storage);
  });

  afterEach(() => {
    if (original) Object.defineProperty(globalThis, 'sessionStorage', original);
    else Reflect.deleteProperty(globalThis, 'sessionStorage');
  });

  it('is inactive before any reload', () => {
    expect(isReloadGuardActive()).toBe(false);
  });

  it('suppresses the prompt right after a reload', () => {
    const now = 1_000_000;
    markReloadAttempt(now);

    expect(isReloadGuardActive(now + 1000)).toBe(true);
  });

  it('lets the prompt return once the window has passed', () => {
    const now = 1_000_000;
    markReloadAttempt(now);

    expect(isReloadGuardActive(now + RELOAD_GUARD_MS + 1)).toBe(false);
  });

  it('records the attempt itself, so a later reload can re-arm it', () => {
    markReloadAttempt(1_000);

    expect(Number(storage.getItem(RELOAD_GUARD_KEY))).toBe(1000);
  });

  it('degrades to no guard when storage is unavailable', () => {
    install(undefined);

    expect(isReloadGuardActive()).toBe(false);
    expect(() => markReloadAttempt()).not.toThrow();
  });

  it('degrades to no guard when storage throws', () => {
    install({
      getItem: () => {
        throw new Error('blocked by privacy settings');
      },
      setItem: () => {
        throw new Error('blocked by privacy settings');
      },
    });

    expect(isReloadGuardActive()).toBe(false);
    expect(() => markReloadAttempt()).not.toThrow();
  });
});
