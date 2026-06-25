import { StorageAdapter } from '@monorepo/react/shared';
import { TOrganization } from '@monorepo/react/shelter';
import { act, renderHook } from '@testing-library/react';
import { ReactNode } from 'react';
import { ActiveOrgProvider } from './index';
import { useActiveOrg } from './useActiveOrg';

function makeOrg(overrides: Partial<TOrganization> = {}): TOrganization {
  return {
    id: 'org-1',
    name: 'Test Org',
    permissions: {
      accounts: [],
      reports: [],
      shelters: [],
      teams: [],
    },
    ...overrides,
  } as TOrganization;
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

function wrapper(
  organizations: TOrganization[],
  storage: StorageAdapter,
  storageKey?: string
) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <ActiveOrgProvider
        organizations={organizations}
        storage={storage}
        storageKey={storageKey}
      >
        {children}
      </ActiveOrgProvider>
    );
  };
}

describe('ActiveOrgProvider', () => {
  const STORAGE_KEY = 'betterangels_active_org_id';

  it('persists the default org ID to storage on mount', () => {
    const storage = createInMemoryStorage();
    const orgs = [makeOrg({ id: 'org-1' }), makeOrg({ id: 'org-2' })];

    renderHook(() => useActiveOrg(), {
      wrapper: wrapper(orgs, storage),
    });

    // After mount, the default (first) org ID should be in storage
    expect(storage.getItem(STORAGE_KEY)).toBe('org-1');
  });

  it('persists the new org ID when setActiveOrgId is called', () => {
    const storage = createInMemoryStorage();
    const orgs = [makeOrg({ id: 'org-1' }), makeOrg({ id: 'org-2' })];

    const { result } = renderHook(() => useActiveOrg(), {
      wrapper: wrapper(orgs, storage),
    });

    // Default should be org-1
    expect(result.current.activeOrg?.id).toBe('org-1');
    expect(storage.getItem(STORAGE_KEY)).toBe('org-1');

    // Switch to org-2
    act(() => {
      result.current.setActiveOrgId('org-2');
    });

    expect(result.current.activeOrg?.id).toBe('org-2');
    expect(storage.getItem(STORAGE_KEY)).toBe('org-2');
  });

  it('reads the initial org ID from storage if available', () => {
    const storage = createInMemoryStorage();
    // Pre-populate storage with org-2
    storage.setItem(STORAGE_KEY, 'org-2');

    const orgs = [makeOrg({ id: 'org-1' }), makeOrg({ id: 'org-2' })];

    const { result } = renderHook(() => useActiveOrg(), {
      wrapper: wrapper(orgs, storage),
    });

    // Should respect the stored preference
    expect(result.current.activeOrg?.id).toBe('org-2');
  });

  it('handles empty organizations list gracefully', () => {
    const storage = createInMemoryStorage();

    const { result } = renderHook(() => useActiveOrg(), {
      wrapper: wrapper([], storage),
    });

    expect(result.current.activeOrg).toBeUndefined();
    // Should not crash or write anything
    expect(storage.getItem(STORAGE_KEY)).toBeNull();
  });
});
