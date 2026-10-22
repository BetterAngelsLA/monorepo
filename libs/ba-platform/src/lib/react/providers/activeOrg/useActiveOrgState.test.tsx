import { act, render, renderHook } from '@testing-library/react';
import { useEffect } from 'react';
import {
  configureActiveOrgStorage,
  getActiveOrgId,
  type ActiveOrgPersistence,
} from '../../../activeOrg';
import { resetActiveOrgStoreForTests } from '../../../activeOrg/activeOrgStore';
import { ActiveOrgProvider } from './index';
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

describe('useActiveOrgState', () => {
  beforeEach(() => {
    // Module-level store: without this, one test's org leaks into the next.
    resetActiveOrgStoreForTests();
  });

  it('defaults to the first organization', async () => {
    configureActiveOrgStorage(createSyncStorage());
    const orgs = [makeOrg({ id: 'org-1' }), makeOrg({ id: 'org-2' })];

    const { result } = await renderHook(() => useActiveOrgState(orgs));

    expect(result.current.activeOrg?.id).toBe('org-1');
  });

  it('publishes the default org to the store, so the interceptor can read it', async () => {
    configureActiveOrgStorage(createSyncStorage());
    const orgs = [makeOrg({ id: 'org-1' }), makeOrg({ id: 'org-2' })];

    await renderHook(() => useActiveOrgState(orgs));

    expect(getActiveOrgId()).toBe('org-1');
  });

  it('publishes a switch to the store synchronously', async () => {
    const storage = createSyncStorage();
    configureActiveOrgStorage(storage);
    const orgs = [makeOrg({ id: 'org-1' }), makeOrg({ id: 'org-2' })];
    const { result } = await renderHook(() => useActiveOrgState(orgs));

    act(() => {
      result.current.setActiveOrgId('org-2');
    });

    expect(result.current.activeOrg?.id).toBe('org-2');
    expect(getActiveOrgId()).toBe('org-2');
    // Persisted in the same call — not one effect later, which is what used to
    // let a request go out against the previous organization.
    expect(storage.get()).toBe('org-2');
  });

  it('restores a remembered organization', async () => {
    configureActiveOrgStorage(createSyncStorage('org-2'));
    const orgs = [makeOrg({ id: 'org-1' }), makeOrg({ id: 'org-2' })];

    const { result } = await renderHook(() => useActiveOrgState(orgs));

    expect(result.current.activeOrg?.id).toBe('org-2');
  });

  it('the remembered organization is live before any component renders', async () => {
    configureActiveOrgStorage(createSyncStorage('org-2'));

    expect(getActiveOrgId()).toBe('org-2');
  });

  it('discards a remembered organization the user no longer belongs to', async () => {
    // e.g. a different user on the same device, or one they were removed from.
    configureActiveOrgStorage(createSyncStorage('org-stale'));
    const orgs = [makeOrg({ id: 'org-1' })];

    const { result } = await renderHook(() => useActiveOrgState(orgs));

    expect(result.current.activeOrg?.id).toBe('org-1');
    expect(getActiveOrgId()).toBe('org-1');
  });

  it('hasPermission reflects the active org', async () => {
    configureActiveOrgStorage(createSyncStorage());
    const orgs = [makeOrg({ id: 'org-1' })];

    const { result } = await renderHook(() => useActiveOrgState(orgs));

    expect(result.current.hasPermission('organizations.add_org_member')).toBe(
      true,
    );
    expect(result.current.hasPermission('shelters.view_shelter')).toBe(true);
    expect(result.current.hasPermission('shelters.delete_shelter')).toBe(false);
  });

  it('ignores backend permission strings the app does not model', async () => {
    configureActiveOrgStorage(createSyncStorage());
    const orgs = [makeOrg({ permissions: ['accounts.view_user'] })];

    const { result } = await renderHook(() => useActiveOrgState(orgs));

    // 'accounts.view_user' is a real backend permission the frontend enum does
    // not model — it must never satisfy a gateable check.
    expect(result.current.hasPermission('shelters.view_shelter')).toBe(false);
    expect(result.current.hasPermission('organizations.add_org_member')).toBe(
      false,
    );
  });

  it('keeps known permissions when unknown ones are present alongside', async () => {
    configureActiveOrgStorage(createSyncStorage());
    const orgs = [
      makeOrg({
        permissions: ['accounts.view_user', 'shelters.view_shelter'],
      }),
    ];

    const { result } = await renderHook(() => useActiveOrgState(orgs));

    expect(result.current.hasPermission('shelters.view_shelter')).toBe(true);
    expect(result.current.hasPermission('organizations.add_org_member')).toBe(
      false,
    );
  });

  it('setActiveOrgId ignores an org the user does not belong to', async () => {
    configureActiveOrgStorage(createSyncStorage());
    const orgs = [makeOrg({ id: 'org-1' })];
    const { result } = await renderHook(() => useActiveOrgState(orgs));

    act(() => {
      result.current.setActiveOrgId('nonexistent-org');
    });

    expect(result.current.activeOrg?.id).toBe('org-1');
    expect(getActiveOrgId()).toBe('org-1');
  });

  it('handles an empty organizations list', async () => {
    configureActiveOrgStorage(createSyncStorage());

    const { result } = await renderHook(() => useActiveOrgState([]));

    expect(result.current.activeOrg).toBeUndefined();
    expect(getActiveOrgId()).toBeNull();
  });

  it('has the org live before a child issues a request', async () => {
    // A child queries on mount from its own effect: React runs that before the
    // provider's *passive* effect but after every layout effect, which is where
    // the provider installs the list. `useOrgTeams.test.tsx` covers the real
    // query path; this pins the ordering it stands on.
    configureActiveOrgStorage(createSyncStorage());
    const orgs = [makeOrg({ id: 'org-1' })];
    const seenInChildEffect: (string | null)[] = [];

    function Child() {
      useEffect(() => {
        seenInChildEffect.push(getActiveOrgId());
      }, []);

      return null;
    }

    await render(
      <ActiveOrgProvider organizations={orgs}>
        <Child />
      </ActiveOrgProvider>,
    );

    expect(seenInChildEffect.length).toBeGreaterThan(0);
    expect(seenInChildEffect).not.toContain(null);
  });

  it('survives the first render, before the organization list is known', async () => {
    // UserProvider renders children with no organizations until its query
    // answers. Treating that as "belongs to nothing" discarded the remembered
    // organization *and* deleted it from persistence, so every launch reset the
    // user to their first org.
    const storage = createSyncStorage('org-2');
    configureActiveOrgStorage(storage);
    const orgs = [makeOrg({ id: 'org-1' }), makeOrg({ id: 'org-2' })];

    const { rerender } = await render(
      <ActiveOrgProvider organizations={undefined}>{null}</ActiveOrgProvider>,
    );

    expect(getActiveOrgId()).toBe('org-2');
    expect(storage.get()).toBe('org-2');

    await rerender(
      <ActiveOrgProvider organizations={orgs}>{null}</ActiveOrgProvider>,
    );

    expect(getActiveOrgId()).toBe('org-2');
  });

  it('keeps sending the remembered org before the org list loads', async () => {
    // No list yet means the user query has not resolved, not that the user
    // belongs to nothing. The store already holds the remembered organization,
    // so requests in that window are correctly attributed.
    configureActiveOrgStorage(createSyncStorage('org-2'));
    const seen: (string | null)[] = [];

    function Child() {
      seen.push(getActiveOrgId());
      return null;
    }

    await render(
      <ActiveOrgProvider organizations={undefined}>
        <Child />
      </ActiveOrgProvider>,
    );

    expect(seen).not.toContain(null);
  });

  it("leaves an outer provider's list in play until it knows its own", async () => {
    // Nesting is real: shelter-web mounts one provider around the app and another
    // inside it. An inner provider with no list must not shadow the outer one
    // with "unknown", which would drop the header.
    configureActiveOrgStorage(createSyncStorage());
    const outer = [makeOrg({ id: 'org-2' })];

    await render(
      <ActiveOrgProvider organizations={outer}>
        <ActiveOrgProvider organizations={undefined}>{null}</ActiveOrgProvider>
      </ActiveOrgProvider>,
    );

    expect(getActiveOrgId()).toBe('org-2');
  });

  it('keeps the active org permissions while the org list is refetching', async () => {
    // `organizations` goes undefined during a currentUser refetch (e.g. right
    // after creating a client). Reading that as "no permissions" blinked every
    // org-scoped control — the Referrals tab among them — out of existence.
    configureActiveOrgStorage(createSyncStorage());
    const orgs = [makeOrg({ permissions: ['referrals.view_referral'] })];

    const { result, rerender } = await renderHook(
      (props: { organizations: Org[] | undefined }) =>
        useActiveOrgState(props.organizations),
      { initialProps: { organizations: orgs } },
    );
    expect(result.current.hasPermission('referrals.view_referral')).toBe(true);

    await rerender({ organizations: undefined });

    expect(result.current.hasPermission('referrals.view_referral')).toBe(true);
  });

  it('still defaults a genuinely org-less user to nothing', async () => {
    configureActiveOrgStorage(createSyncStorage());

    const { result } = await renderHook(() => useActiveOrgState([]));

    expect(result.current.activeOrg).toBeUndefined();
    expect(getActiveOrgId()).toBeNull();
  });
});
