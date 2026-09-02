import { describe, expect, it } from 'vitest';

import { hasPermission, type TUser } from './UserContext';

const globalUser: TUser = {
  id: '1',
  permissions: ['shelters.delete_shelter', 'organizations.add_org_member'],
  organizations: [],
};

const orgScopedUser: TUser = {
  id: '2',
  permissions: [],
  organization: {
    id: 'org-1',
    name: 'Org One',
    permissions: ['shelters.view_shelter', 'shelters.change_shelter'],
  },
  organizations: [],
};

describe('hasPermission', () => {
  it('grants a permission held at the global tier', () => {
    expect(hasPermission(globalUser, 'shelters.delete_shelter')).toBe(true);
    expect(hasPermission(globalUser, 'shelters.view_shelter')).toBe(false);
  });

  it('grants a permission held by the active organization', () => {
    expect(hasPermission(orgScopedUser, 'shelters.view_shelter')).toBe(true);
    expect(hasPermission(orgScopedUser, 'shelters.delete_shelter')).toBe(false);
  });

  it('denies everything for an undefined user', () => {
    expect(hasPermission(undefined, 'shelters.view_shelter')).toBe(false);
  });
});
