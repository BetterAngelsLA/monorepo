import {
  clearActiveOrgId,
  configureActiveOrgStorage,
  getActiveOrgId,
  resetActiveOrgStoreForTests,
  setActiveOrgId,
  subscribeActiveOrgId,
  type ActiveOrgPersistence,
} from './activeOrgStore';

function createSyncStorage(initial: string | null = null): ActiveOrgPersistence {
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
});
