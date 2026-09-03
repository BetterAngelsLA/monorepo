import { isPermission, ShelterPermissions, UserOrganizationPermissions } from './index';

describe('isPermission', () => {
  it('accepts every generated permission string', () => {
    expect(isPermission(ShelterPermissions.View)).toBe(true);
    expect(isPermission('shelters.view_shelter')).toBe(true);
    expect(isPermission(UserOrganizationPermissions.ViewOrgMembers)).toBe(true);
    expect(isPermission('organizations.view_org_members')).toBe(true);
  });

  it('rejects strings the frontend does not model', () => {
    // Backend-only / admin permissions (not currently in the generated enum) are
    // not gateable on the frontend and must be filtered at the boundary.
    expect(isPermission('accounts.view_user')).toBe(false);
    expect(isPermission('accounts.change_grant')).toBe(false);
    // Unknown models, junk, empty.
    expect(isPermission('shelters.view_unknown_model')).toBe(false);
    expect(isPermission('')).toBe(false);
  });
});
