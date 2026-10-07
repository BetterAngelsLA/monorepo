import {
  ContactInfoPermissions,
  ShelterPermissions,
} from '@monorepo/ba-platform/permissions';
import { renderHook } from '@testing-library/react';
import { useBaPrivatePermissions } from './useBaPrivatePermissions';

const mocks = vi.hoisted(() => ({
  hasGlobalPermission: vi.fn(),
  hasOrgPermission: vi.fn(),
}));

vi.mock('@monorepo/react/shelter', () => ({
  useUser: () => ({ hasGlobalPermission: mocks.hasGlobalPermission }),
}));

// BA-private is a GLOBAL-tier domain, so the hook must never route through the
// active org's effective entry: a scoped Grant can carry the ContactInfo perms
// there while the backend's `can_globally` still refuses (finding H2). This
// mock hands the permission out on the org entry on purpose, so a change that
// starts consulting it fails here instead of shipping.
vi.mock('@monorepo/ba-platform', () => ({
  useActiveOrg: () => ({ hasPermission: mocks.hasOrgPermission }),
}));

/** Grants exactly `permissions` on the user's global list. */
function grantGlobal(...permissions: string[]) {
  mocks.hasGlobalPermission.mockImplementation((permission: string) =>
    permissions.includes(permission),
  );
}

describe('useBaPrivatePermissions', () => {
  beforeEach(() => {
    mocks.hasGlobalPermission.mockReset();
    mocks.hasOrgPermission.mockReset();
    mocks.hasOrgPermission.mockReturnValue(true);
  });

  it('maps the contacts section to the global ContactInfo perms', () => {
    grantGlobal(ContactInfoPermissions.View, ContactInfoPermissions.Change);

    const { result } = renderHook(() => useBaPrivatePermissions());

    expect(result.current.additionalContactsPermissions).toEqual({
      canView: true,
      canEdit: true,
    });
    expect(result.current.canViewAny).toBe(true);
    expect(mocks.hasGlobalPermission).toHaveBeenCalledWith(
      ContactInfoPermissions.View,
    );
    expect(mocks.hasGlobalPermission).toHaveBeenCalledWith(
      ContactInfoPermissions.Change,
    );
  });

  it('reads the global list, never the active org entry', () => {
    grantGlobal(ContactInfoPermissions.View);

    renderHook(() => useBaPrivatePermissions());

    expect(mocks.hasOrgPermission).not.toHaveBeenCalled();
  });

  it('keeps canEdit false for a read-only operator', () => {
    grantGlobal(ContactInfoPermissions.View);

    const { result } = renderHook(() => useBaPrivatePermissions());

    expect(result.current.additionalContactsPermissions).toEqual({
      canView: true,
      canEdit: false,
    });
    // The area gate follows the read gate, so the segment stays reachable.
    expect(result.current.canViewAny).toBe(true);
  });

  it('does not admit the area on a write-only entry', () => {
    grantGlobal(ContactInfoPermissions.Change);

    const { result } = renderHook(() => useBaPrivatePermissions());

    expect(result.current.additionalContactsPermissions.canEdit).toBe(true);
    // `can_globally(ContactInfo.VIEW)` is the read gate, so a change-only role
    // must not be routed into the segment even though it could write.
    expect(result.current.canViewAny).toBe(false);
  });

  it('stays closed for unrelated global permissions', () => {
    grantGlobal(
      ShelterPermissions.View,
      ShelterPermissions.Add,
      ShelterPermissions.Change,
    );

    const { result } = renderHook(() => useBaPrivatePermissions());

    expect(result.current.additionalContactsPermissions).toEqual({
      canView: false,
      canEdit: false,
    });
    expect(result.current.canViewAny).toBe(false);
  });

  it('is fail-closed while the user query is unresolved', () => {
    // `UserProvider.hasGlobalPermission` reads an undefined user as denied.
    mocks.hasGlobalPermission.mockReturnValue(false);

    const { result } = renderHook(() => useBaPrivatePermissions());

    expect(result.current.additionalContactsPermissions).toEqual({
      canView: false,
      canEdit: false,
    });
    expect(result.current.canViewAny).toBe(false);
  });
});
