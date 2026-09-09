import { defaultMapOrganizations } from './createUserProvider';

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
