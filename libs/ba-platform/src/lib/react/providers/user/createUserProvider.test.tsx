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
