import { ShelterPermissions } from '@monorepo/ba-platform/permissions';
import { render, screen } from '@testing-library/react';
import { CurrentOrgUserDocument } from '../../../apollo';
import {
  createUserProvider,
  defaultMapOrganizations,
} from './createUserProvider';

const mockUseQuery = vi.fn();

vi.mock('@apollo/client/react', () => ({
  useQuery: () => mockUseQuery(),
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
