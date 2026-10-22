import { ShelterPermissions } from '@monorepo/ba-platform/permissions';
import { act, render, screen } from '@testing-library/react';
import { useEffect } from 'react';
import { CurrentOrgUserDocument } from '../../../apollo';
import {
  createUserProvider,
  defaultMapOrganizations,
} from './createUserProvider';

const mockUseQuery = vi.fn();
const mockReadQuery = vi.fn(() => null);

vi.mock('@apollo/client/react', () => ({
  // `client` mirrors the real result: the org source reads the organizations the
  // query has already written to the cache.
  useQuery: () => ({ ...mockUseQuery(), client: { readQuery: mockReadQuery } }),
}));

type TestUser = {
  id: string;
  permissions?: readonly string[];
};

const { UserProvider, useUser } = createUserProvider({
  document: CurrentOrgUserDocument,
  parseUser: (data): TestUser | undefined => {
    const currentUser = data as { permissions?: readonly string[] } | undefined;

    return currentUser
      ? { id: 'user-1', permissions: currentUser.permissions }
      : undefined;
  },
  isUnauthenticated: () => false,
});

function PermissionProbe() {
  const { hasGlobalPermission } = useUser();

  const canAdd = String(hasGlobalPermission(ShelterPermissions.Add));
  const canDelete = String(hasGlobalPermission(ShelterPermissions.Delete));

  return <span data-testid="probe">{`${canAdd}:${canDelete}`}</span>;
}

describe('defaultMapOrganizations', () => {
  it('keeps only the permission strings the frontend models', () => {
    const orgs = [
      {
        id: 'org-1',
        name: 'Test Org',
        permissions: [
          'accounts.view_user',
          'organizations.add_org_member',
          'shelters.view_shelter',
        ],
      },
    ];

    expect(defaultMapOrganizations(orgs)).toEqual([
      {
        id: 'org-1',
        name: 'Test Org',
        permissions: ['organizations.add_org_member', 'shelters.view_shelter'],
      },
    ]);
  });

  it('defaults a missing permissions array to an empty one', () => {
    const orgs = [{ id: 'org-1', name: 'Test Org' }];

    expect(defaultMapOrganizations(orgs)).toEqual([
      { id: 'org-1', name: 'Test Org', permissions: [] },
    ]);
  });
});

describe('UserProvider hasGlobalPermission', () => {
  function loadedUser(permissions: readonly string[]) {
    return {
      data: { currentUser: { permissions } },
      loading: false,
      error: undefined,
      refetch: vi.fn(),
    };
  }

  function renderProbe() {
    render(
      <UserProvider>
        <PermissionProbe />
      </UserProvider>,
    );

    return screen.getByTestId('probe').textContent;
  }

  beforeEach(() => {
    mockUseQuery.mockReset();
  });

  it('grants only the global permissions the user holds', () => {
    mockUseQuery.mockReturnValue(loadedUser([ShelterPermissions.Add]));

    expect(renderProbe()).toBe('true:false');
  });

  it('denies a global permission the user does not hold', () => {
    mockUseQuery.mockReturnValue(loadedUser([ShelterPermissions.Change]));

    expect(renderProbe()).toBe('false:false');
  });

  it('is false until the user has loaded', () => {
    mockUseQuery.mockReturnValue({
      data: undefined,
      loading: true,
      error: undefined,
      refetch: vi.fn(),
    });

    expect(renderProbe()).toBe('false:false');
  });
});

describe('UserProvider parseUser receives the current user', () => {
  // Regression test for the consent-accept race: the app refetches
  // `currentUser` on foreground, so a read issued *before* a local write can
  // resolve *after* it. Applying that payload verbatim undid the write. The
  // provider now hands `parseUser` the user already in context, so the app can
  // decide what wins instead of resolution order deciding.
  function mergeable() {
    const parseUser = vi.fn(
      (data: unknown, prev: TestUser | undefined): TestUser | undefined => {
        const currentUser = data as
          | { permissions?: readonly string[] }
          | undefined;

        // A flag that is only ever added, never removed — the shape of the
        // real rule ("once accepted, stay accepted").
        const kept = prev?.permissions ?? [];

        return currentUser
          ? {
              id: 'user-1',
              permissions: [
                ...new Set([...kept, ...(currentUser.permissions ?? [])]),
              ],
            }
          : undefined;
      },
    );

    const { UserProvider: MergeProvider, useUser: useMergeUser } =
      createUserProvider({
        document: CurrentOrgUserDocument,
        parseUser,
        isUnauthenticated: () => false,
      });

    function Probe() {
      const { user } = useMergeUser();

      return (
        <span data-testid="merge-probe">
          {(user?.permissions ?? []).join(',') || 'none'}
        </span>
      );
    }

    const read = (permissions: readonly string[]) => ({
      data: { currentUser: { permissions } },
      loading: false,
      error: undefined,
      refetch: vi.fn(),
    });

    return { MergeProvider, Probe, parseUser, read };
  }

  beforeEach(() => {
    mockUseQuery.mockReset();
  });

  it('passes undefined as prev on the first load', () => {
    const { MergeProvider, Probe, parseUser, read } = mergeable();

    mockUseQuery.mockReturnValue(read([ShelterPermissions.Add]));
    render(
      <MergeProvider>
        <Probe />
      </MergeProvider>,
    );

    expect(parseUser).toHaveBeenCalledWith(
      expect.objectContaining({ permissions: [ShelterPermissions.Add] }),
      undefined,
    );
  });

  it('lets a later read merge with what is already applied', () => {
    const { MergeProvider, Probe, read } = mergeable();

    mockUseQuery.mockReturnValue(read([ShelterPermissions.Add]));
    const { rerender } = render(
      <MergeProvider>
        <Probe />
      </MergeProvider>,
    );
    expect(screen.getByTestId('merge-probe').textContent).toBe(
      ShelterPermissions.Add,
    );

    // A stale read lands carrying the older payload.
    mockUseQuery.mockReturnValue(read([]));
    rerender(
      <MergeProvider>
        <Probe />
      </MergeProvider>,
    );

    expect(screen.getByTestId('merge-probe').textContent).toBe(
      ShelterPermissions.Add,
    );
  });
});

describe('UserProvider keeps the user across an empty read', () => {
  // An empty payload is not a sign-out — `isUnauthenticated` is. It is a read
  // that resolved empty (a failed request under `errorPolicy: 'all'`, a reset
  // cache, one that resolved across a local write). Replacing the user with
  // `undefined` there blanked every permission and the org list until the next
  // successful read, which is what removed the Referrals tab after a mutation.
  const loaded = () => ({
    data: { currentUser: { permissions: [ShelterPermissions.Add] } },
    loading: false,
    error: undefined,
    refetch: vi.fn(),
  });
  const empty = () => ({
    data: undefined,
    loading: false,
    error: new Error('network'),
    refetch: vi.fn(),
  });

  beforeEach(() => {
    mockUseQuery.mockReset();
  });

  it('keeps the previous user', () => {
    mockUseQuery.mockReturnValue(loaded());
    const { rerender } = render(
      <UserProvider>
        <PermissionProbe />
      </UserProvider>,
    );
    expect(screen.getByTestId('probe').textContent).toBe('true:false');

    mockUseQuery.mockReturnValue(empty());
    rerender(
      <UserProvider>
        <PermissionProbe />
      </UserProvider>,
    );

    expect(screen.getByTestId('probe').textContent).toBe('true:false');
  });

  it('still starts empty before the first read resolves', () => {
    mockUseQuery.mockReturnValue({
      data: undefined,
      loading: true,
      error: undefined,
      refetch: vi.fn(),
    });

    render(
      <UserProvider>
        <PermissionProbe />
      </UserProvider>,
    );

    expect(screen.getByTestId('probe').textContent).toBe('false:false');
  });
});

describe('UserProvider keeps the user when a refetch rejects', () => {
  // A rejected `refetch()` is a transport failure (the foreground refetch in
  // `ExpoShell`), not a sign-out. Only `isUnauthenticated` may clear the user;
  // blanking here flipped the app to unauthorized on a network blip.
  let refetchUserRef: (() => Promise<void>) | undefined;

  function RefetchProbe() {
    const { refetchUser, hasGlobalPermission } = useUser();

    useEffect(() => {
      refetchUserRef = refetchUser;
    }, [refetchUser]);

    return (
      <span data-testid="refetch-probe">
        {String(hasGlobalPermission(ShelterPermissions.Add))}
      </span>
    );
  }

  beforeEach(() => {
    mockUseQuery.mockReset();
    refetchUserRef = undefined;
  });

  it('keeps the last known user on a transport failure', async () => {
    mockUseQuery.mockReturnValue({
      data: { currentUser: { permissions: [ShelterPermissions.Add] } },
      loading: false,
      error: undefined,
      refetch: vi.fn().mockRejectedValue(new Error('network')),
    });

    render(
      <UserProvider>
        <RefetchProbe />
      </UserProvider>,
    );
    expect(screen.getByTestId('refetch-probe').textContent).toBe('true');

    await act(async () => {
      await refetchUserRef?.();
    });

    expect(screen.getByTestId('refetch-probe').textContent).toBe('true');
  });
});
