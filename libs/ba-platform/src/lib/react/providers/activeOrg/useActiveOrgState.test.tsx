import { StorageAdapter } from '@monorepo/react/shared';
import { act, renderHook } from '@testing-library/react';
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

function createInMemoryStorage(): StorageAdapter {
  const store = new Map<string, string>();
  return {
    getItem(key: string): string | null {
      return store.get(key) ?? null;
    },
    setItem(key: string, value: string): void {
      store.set(key, value);
    },
  };
}

const STORAGE_KEY = 'betterangels_active_org_id';

describe('useActiveOrgState', () => {
  it('defaults to the first organization', () => {
    const orgs = [makeOrg({ id: 'org-1' }), makeOrg({ id: 'org-2' })];

    const { result } = renderHook(() =>
      useActiveOrgState(orgs, {
        storage: createInMemoryStorage(),
      })
    );

    expect(result.current.activeOrg?.id).toBe('org-1');
  });

  it('persists the default org ID to storage on mount', () => {
    const storage = createInMemoryStorage();
    const orgs = [makeOrg({ id: 'org-1' }), makeOrg({ id: 'org-2' })];

    renderHook(() => useActiveOrgState(orgs, { storage }));

    expect(storage.getItem(STORAGE_KEY)).toBe('org-1');
  });

  it('persists the new org ID when setActiveOrgId is called', () => {
    const storage = createInMemoryStorage();
    const orgs = [makeOrg({ id: 'org-1' }), makeOrg({ id: 'org-2' })];

    const { result } = renderHook(() => useActiveOrgState(orgs, { storage }));

    expect(storage.getItem(STORAGE_KEY)).toBe('org-1');

    act(() => {
      result.current.setActiveOrgId('org-2');
    });

    expect(result.current.activeOrg?.id).toBe('org-2');
    expect(storage.getItem(STORAGE_KEY)).toBe('org-2');
  });

  it('reads the initial org ID from storage if available', () => {
    const storage = createInMemoryStorage();
    storage.setItem(STORAGE_KEY, 'org-2');

    const orgs = [makeOrg({ id: 'org-1' }), makeOrg({ id: 'org-2' })];

    const { result } = renderHook(() => useActiveOrgState(orgs, { storage }));

    expect(result.current.activeOrg?.id).toBe('org-2');
  });

  it('hasPermission returns true for permissions the org has', () => {
    const orgs = [makeOrg({ id: 'org-1' })];

    const { result } = renderHook(() =>
      useActiveOrgState(orgs, {
        storage: createInMemoryStorage(),
      })
    );

    expect(result.current.hasPermission('organizations.add_org_member')).toBe(true);
    expect(result.current.hasPermission('shelters.view_shelter')).toBe(true);
    expect(result.current.hasPermission('shelters.delete_shelter')).toBe(false);
  });

  it('setActiveOrgId ignores unknown org IDs', () => {
    const storage = createInMemoryStorage();
    const orgs = [makeOrg({ id: 'org-1' })];

    const { result } = renderHook(() => useActiveOrgState(orgs, { storage }));

    act(() => {
      result.current.setActiveOrgId('nonexistent-org');
    });

    // Should stay on org-1
    expect(result.current.activeOrg?.id).toBe('org-1');
    expect(storage.getItem(STORAGE_KEY)).toBe('org-1');
  });

  it('handles empty organizations list gracefully', () => {
    const storage = createInMemoryStorage();

    const { result } = renderHook(() =>
      useActiveOrgState([], { storage })
    );

    expect(result.current.activeOrg).toBeUndefined();
    expect(storage.getItem(STORAGE_KEY)).toBeNull();
  });
});
