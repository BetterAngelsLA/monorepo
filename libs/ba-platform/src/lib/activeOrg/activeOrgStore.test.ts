import {
  clearActiveOrgId,
  pushActiveOrgSource,
  configureActiveOrgStorage,
  getActiveOrgId,
  resetActiveOrgStoreForTests,
  setActiveOrgId,
  subscribeActiveOrgId,
  type ActiveOrgPersistence,
} from './activeOrgStore';

function createSyncStorage(
  initial: string | null = null,
): ActiveOrgPersistence {
  let value = initial;
  return {
    get: () => value,
    set: (next) => {
      value = next;
    },
  };
}

describe('activeOrgStore', () => {
  beforeEach(() => {
    resetActiveOrgStoreForTests();
  });

  it('starts empty', () => {
    expect(getActiveOrgId()).toBeNull();
  });

  it('seeds synchronously from the configured storage', () => {
    configureActiveOrgStorage(createSyncStorage('org-7'));

    expect(getActiveOrgId()).toBe('org-7');
  });

  it('writes through to storage on set', () => {
    const storage = createSyncStorage();
    configureActiveOrgStorage(storage);

    setActiveOrgId('org-2');

    expect(storage.get()).toBe('org-2');
  });

  it('notifies subscribers on change', () => {
    configureActiveOrgStorage(createSyncStorage());
    const listener = vi.fn();
    subscribeActiveOrgId(listener);

    setActiveOrgId('org-2');

    expect(listener).toHaveBeenCalledTimes(1);
  });

  it('does not notify when the id is unchanged', () => {
    configureActiveOrgStorage(createSyncStorage('org-2'));
    const listener = vi.fn();
    subscribeActiveOrgId(listener);

    setActiveOrgId('org-2');

    expect(listener).not.toHaveBeenCalled();
  });

  it('stops notifying after unsubscribe', () => {
    configureActiveOrgStorage(createSyncStorage());
    const listener = vi.fn();
    const unsubscribe = subscribeActiveOrgId(listener);

    unsubscribe();
    setActiveOrgId('org-2');

    expect(listener).not.toHaveBeenCalled();
  });

  it('clear forgets the id and the persisted copy', () => {
    const storage = createSyncStorage('org-2');
    configureActiveOrgStorage(storage);

    clearActiveOrgId();

    expect(getActiveOrgId()).toBeNull();
    expect(storage.get()).toBeNull();
  });

  it('broadcasts when clearing, even with no selected id to change', () => {
    // The sources alone can supply the id, so dropping them changes what
    // `getActiveOrgId()` answers while the *selected* id never moved. Skipping the
    // broadcast here leaves every subscriber on the organization we just dropped.
    configureActiveOrgStorage(createSyncStorage());
    pushActiveOrgSource(() => [{ id: 'org-1' }, { id: 'org-2' }]);

    expect(getActiveOrgId()).toBe('org-1');

    const listener = vi.fn();
    subscribeActiveOrgId(listener);

    clearActiveOrgId();

    expect(getActiveOrgId()).toBeNull();
    expect(listener).toHaveBeenCalled();
  });

  it('survives a storage backend that throws on write', () => {
    configureActiveOrgStorage({
      get: () => null,
      set: () => {
        throw new Error('quota exceeded');
      },
    });

    setActiveOrgId('org-2');

    // Persistence is best-effort; the session must still work.
    expect(getActiveOrgId()).toBe('org-2');
  });

  describe('derivation', () => {
    const orgs = [{ id: 'org-1' }, { id: 'org-2' }];

    it('keeps a remembered id the user still belongs to', () => {
      configureActiveOrgStorage(createSyncStorage('org-2'));
      pushActiveOrgSource(() => orgs);

      expect(getActiveOrgId()).toBe('org-2');
    });

    it('replaces a remembered id the user no longer belongs to', () => {
      configureActiveOrgStorage(createSyncStorage('org-stale'));
      pushActiveOrgSource(() => orgs);

      // Read-time, so even a request issued before any component renders is
      // attributed to an organization the user is actually in.
      expect(getActiveOrgId()).toBe('org-1');
    });

    it('keeps the remembered id while the organization list is unknown', () => {
      configureActiveOrgStorage(createSyncStorage('org-2'));
      pushActiveOrgSource(() => null);

      expect(getActiveOrgId()).toBe('org-2');
    });

    it('sends nothing once the user is known to belong to no organization', () => {
      configureActiveOrgStorage(createSyncStorage('org-2'));
      pushActiveOrgSource(() => []);

      expect(getActiveOrgId()).toBeNull();
    });

    it('falls back to the remembered id when the source throws', () => {
      configureActiveOrgStorage(createSyncStorage('org-2'));
      pushActiveOrgSource(() => {
        throw new Error('no cache');
      });

      expect(getActiveOrgId()).toBe('org-2');
    });

    it('persists the choice, not the derived default', () => {
      const storage = createSyncStorage('org-stale');
      configureActiveOrgStorage(storage);
      pushActiveOrgSource(() => orgs);

      expect(getActiveOrgId()).toBe('org-1');
      // The default is derived on every read rather than written back, so the
      // persisted value stays what the user actually chose.
      expect(storage.get()).toBe('org-stale');

      setActiveOrgId('org-2');

      expect(storage.get()).toBe('org-2');
    });

    it('notifies synchronously when the user picks an organization', () => {
      configureActiveOrgStorage(createSyncStorage());
      pushActiveOrgSource(() => orgs);
      const listener = vi.fn();
      subscribeActiveOrgId(listener);

      setActiveOrgId('org-2');

      expect(listener).toHaveBeenCalledTimes(1);
    });

    it('clears the choice while a list is installed', () => {
      const storage = createSyncStorage('org-2');
      configureActiveOrgStorage(storage);
      pushActiveOrgSource(() => orgs);

      expect(getActiveOrgId()).toBe('org-2');

      clearActiveOrgId();

      // Deriving from the list would put an organization straight back into a
      // request from the session being torn down, and the persisted choice has
      // to be gone as well.
      expect(getActiveOrgId()).toBeNull();
      expect(storage.get()).toBeNull();
    });

    it('clears the persisted id when the list is known to be empty', () => {
      const storage = createSyncStorage('org-stale');
      configureActiveOrgStorage(storage);
      pushActiveOrgSource(() => []);

      // Already null by derivation — which is exactly why the write cannot
      // compare against the derived value.
      expect(getActiveOrgId()).toBeNull();

      clearActiveOrgId();

      expect(storage.get()).toBeNull();
    });

    it('persists an explicit pick even when it matches the derived default', () => {
      const storage = createSyncStorage('org-stale');
      configureActiveOrgStorage(storage);
      pushActiveOrgSource(() => orgs);

      // The default is already org-1, so a write that compared against the
      // derived value would leave the stale id persisted.
      setActiveOrgId('org-1');

      expect(storage.get()).toBe('org-1');
    });

    it('restores the outer list when a nested reader is disposed', () => {
      configureActiveOrgStorage(createSyncStorage());
      const outer = [{ id: 'org-outer' }];
      const inner = [{ id: 'org-inner' }];

      pushActiveOrgSource(() => outer);
      const dispose = pushActiveOrgSource(() => inner);

      expect(getActiveOrgId()).toBe('org-inner');

      dispose();

      expect(getActiveOrgId()).toBe('org-outer');
    });
  });
});
