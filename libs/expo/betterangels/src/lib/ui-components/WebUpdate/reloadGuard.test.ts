import {
  isReloadGuardActive,
  markReloadAttempt,
  RELOAD_GUARD_KEY,
  RELOAD_GUARD_MS,
} from './reloadGuard';

/**
 * These run under the native test environment, which has no `window` or `sessionStorage`
 * — the same situation as SSR. Installing a small in-memory stand-in keeps the
 * test on the real code path (it reads `globalThis`) and lets the
 * unavailable-storage case be exercised exactly.
 */
const makeStorage = () => {
  const store = new Map<string, string>();

  return {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => void store.set(key, value),
    removeItem: (key: string) => void store.delete(key),
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

const DEPLOYED = 'aaaa11112222';
const NEXT_DEPLOY = 'bbbb33334444';

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
    expect(isReloadGuardActive(DEPLOYED)).toBe(false);
  });

  it('suppresses the prompt for the build that was just reloaded', () => {
    const now = 1_000_000;
    markReloadAttempt(DEPLOYED, now);

    expect(isReloadGuardActive(DEPLOYED, now + 1000)).toBe(true);
  });

  it('lets the prompt return once the window has passed', () => {
    const now = 1_000_000;
    markReloadAttempt(DEPLOYED, now);

    expect(isReloadGuardActive(DEPLOYED, now + RELOAD_GUARD_MS + 1)).toBe(false);
  });

  it('clears immediately when a newer deployment appears', () => {
    // Otherwise a reload that happened to land on the old HTML would mute the
    // prompt while the fix was already live.
    const now = 1_000_000;
    markReloadAttempt(DEPLOYED, now);

    expect(isReloadGuardActive(NEXT_DEPLOY, now + 1000)).toBe(false);
  });

  it('does not stick when the clock moves backwards', () => {
    const now = 1_000_000;
    markReloadAttempt(DEPLOYED, now);

    expect(isReloadGuardActive(DEPLOYED, now - 60_000)).toBe(false);
  });

  it('records the build it was armed for', () => {
    markReloadAttempt(DEPLOYED, 1_000);

    expect(JSON.parse(storage.getItem(RELOAD_GUARD_KEY) ?? '{}')).toMatchObject({
      buildId: DEPLOYED,
      at: 1000,
    });
  });

  it('degrades to no guard when storage is unavailable', () => {
    install(undefined);

    expect(isReloadGuardActive(DEPLOYED)).toBe(false);
    expect(() => markReloadAttempt(DEPLOYED)).not.toThrow();
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

    expect(isReloadGuardActive(DEPLOYED)).toBe(false);
    expect(() => markReloadAttempt(DEPLOYED)).not.toThrow();
  });

  it('ignores a corrupt record', () => {
    storage.setItem(RELOAD_GUARD_KEY, 'not json');

    expect(isReloadGuardActive(DEPLOYED)).toBe(false);
  });
});
