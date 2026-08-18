import { act, render, renderHook } from '@testing-library/react';
import { ActiveOrgProvider } from './index';
import {
  configureActiveOrgStorage,
  getActiveOrgId,
  type ActiveOrgPersistence,
} from '../../../activeOrg';
import { resetActiveOrgStoreForTests } from '../../../activeOrg/activeOrgStore';
import { useActiveOrgState, type Org } from './useActiveOrgState';

function makeOrg(overrides: Partial<Org> = {}): Org {
  return {
    id: 'org-1',
    name: 'Test Org',
    permissions: [
      'organizations.add_org_member',
      'organizations.view_org_members',
      'shelters.view_shelter',
    ],
    ...overrides,
  };
}

/** Synchronous backing, the way both platforms now provide one. */
function createSyncStorage(initial: string | null = null): ActiveOrgPersistence {
  let value = initial;
  return {
    get: () => value,
    set: (next) => {
      value = next;
    },
  };
}

describe('useActiveOrgState', () => {
  beforeEach(() => {
    // Module-level store: without this, one test's org leaks into the next.
    resetActiveOrgStoreForTests();
  });

  it('defaults to the first organization', () => {
    configureActiveOrgStorage(createSyncStorage());
    const orgs = [makeOrg({ id: 'org-1' }), makeOrg({ id: 'org-2' })];

    const { result } = renderHook(() => useActiveOrgState(orgs));

    expect(result.current.activeOrg?.id).toBe('org-1');
  });

  it('publishes the default org to the store, so the interceptor can read it', () => {
    configureActiveOrgStorage(createSyncStorage());
    const orgs = [makeOrg({ id: 'org-1' }), makeOrg({ id: 'org-2' })];

    renderHook(() => useActiveOrgState(orgs));

    expect(getActiveOrgId()).toBe('org-1');
  });

  it('publishes a switch to the store synchronously', () => {
    const storage = createSyncStorage();
    configureActiveOrgStorage(storage);
    const orgs = [makeOrg({ id: 'org-1' }), makeOrg({ id: 'org-2' })];
    const { result } = renderHook(() => useActiveOrgState(orgs));

    act(() => {
      result.current.setActiveOrgId('org-2');
    });

    expect(result.current.activeOrg?.id).toBe('org-2');
    expect(getActiveOrgId()).toBe('org-2');
    // Persisted in the same call — not one effect later, which is what used to
    // let a request go out against the previous organization.
    expect(storage.get()).toBe('org-2');
  });

  it('restores a remembered organization', () => {
    configureActiveOrgStorage(createSyncStorage('org-2'));
    const orgs = [makeOrg({ id: 'org-1' }), makeOrg({ id: 'org-2' })];

    const { result } = renderHook(() => useActiveOrgState(orgs));

    expect(result.current.activeOrg?.id).toBe('org-2');
  });

  it('the remembered organization is live before any component renders', () => {
    configureActiveOrgStorage(createSyncStorage('org-2'));

    expect(getActiveOrgId()).toBe('org-2');
  });

  it('discards a remembered organization the user no longer belongs to', () => {
    // e.g. a different user on the same device, or one they were removed from.
    configureActiveOrgStorage(createSyncStorage('org-stale'));
    const orgs = [makeOrg({ id: 'org-1' })];

    const { result } = renderHook(() => useActiveOrgState(orgs));

    expect(result.current.activeOrg?.id).toBe('org-1');
    expect(getActiveOrgId()).toBe('org-1');
  });

  it('hasPermission reflects the active org', () => {
    configureActiveOrgStorage(createSyncStorage());
    const orgs = [makeOrg({ id: 'org-1' })];

    const { result } = renderHook(() => useActiveOrgState(orgs));

    expect(result.current.hasPermission('organizations.add_org_member')).toBe(true);
    expect(result.current.hasPermission('shelters.view_shelter')).toBe(true);
    expect(result.current.hasPermission('shelters.delete_shelter')).toBe(false);
  });

  it('setActiveOrgId ignores an org the user does not belong to', () => {
    configureActiveOrgStorage(createSyncStorage());
    const orgs = [makeOrg({ id: 'org-1' })];
    const { result } = renderHook(() => useActiveOrgState(orgs));

    act(() => {
      result.current.setActiveOrgId('nonexistent-org');
    });

    expect(result.current.activeOrg?.id).toBe('org-1');
    expect(getActiveOrgId()).toBe('org-1');
  });

  it('handles an empty organizations list', () => {
    configureActiveOrgStorage(createSyncStorage());

    const { result } = renderHook(() => useActiveOrgState([]));

    expect(result.current.activeOrg).toBeUndefined();
    expect(getActiveOrgId()).toBeNull();
  });

  it('the org is live before a child renders, not one effect later', () => {
    // Most org-scoped queries fire unconditionally — no skip to hide behind.
    configureActiveOrgStorage(createSyncStorage());
    const orgs = [makeOrg({ id: 'org-1' })];
    const seenDuringChildRender: (string | null)[] = [];

    function Child() {
      // Stands in for any component that queries on mount.
      seenDuringChildRender.push(getActiveOrgId());
      return null;
    }

    render(
      <ActiveOrgProvider organizations={orgs}>
        <Child />
      </ActiveOrgProvider>,
    );

    expect(seenDuringChildRender.length).toBeGreaterThan(0);
    expect(seenDuringChildRender).not.toContain(null);
  });
});
