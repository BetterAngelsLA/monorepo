import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router';
import { TeamPermissions } from '@monorepo/ba-platform/permissions';
import { PermissionGate } from './PermissionGate';

const mocks = vi.hoisted(() => ({
  useActiveOrg: vi.fn(),
}));

// Only `useActiveOrg` is replaced; the rest of the barrel is imported for real
// so unrelated consumers in the tree still resolve.
vi.mock('@monorepo/ba-platform', async () => {
  const actual = await vi.importActual<Record<string, unknown>>(
    '@monorepo/ba-platform',
  );

  return { ...actual, useActiveOrg: () => mocks.useActiveOrg() };
});

const FALLBACK_PATH = '/fallback';
const ORG = { id: 'org-1', name: 'Org One', permissions: [] };

function renderGate() {
  render(
    <MemoryRouter initialEntries={['/gated']}>
      <Routes>
        <Route path={FALLBACK_PATH} element={<div>fallback page</div>} />
        <Route
          path="/gated"
          element={
            <PermissionGate
              permission={TeamPermissions.View}
              fallbackPath={FALLBACK_PATH}
            >
              <div>gated content</div>
            </PermissionGate>
          }
        />
      </Routes>
    </MemoryRouter>,
  );
}

describe('PermissionGate', () => {
  it('does not redirect while the active-org selection is still resolving', () => {
    // The real first-mount window: the store reports the remembered org id
    // until its source is pushed, so on a fresh session activeOrg is undefined
    // while the list is not. Seen end to end in the admin's gatedRoutes.spec.
    mocks.useActiveOrg.mockReturnValue({
      activeOrg: undefined,
      organizations: [ORG],
      hasPermission: () => false,
    });

    renderGate();

    // Neither bounced to the fallback nor pretending to be permitted.
    expect(screen.queryByText('fallback page')).toBeNull();
    expect(screen.queryByText('gated content')).toBeNull();
  });

  it('redirects when the permission is genuinely missing', () => {
    mocks.useActiveOrg.mockReturnValue({
      activeOrg: ORG,
      organizations: [ORG],
      hasPermission: () => false,
    });

    renderGate();

    expect(screen.getByText('fallback page')).toBeTruthy();
    expect(screen.queryByText('gated content')).toBeNull();
  });

  it('renders children when the permission is held', () => {
    mocks.useActiveOrg.mockReturnValue({
      activeOrg: ORG,
      organizations: [ORG],
      hasPermission: () => true,
    });

    renderGate();

    expect(screen.getByText('gated content')).toBeTruthy();
    expect(screen.queryByText('fallback page')).toBeNull();
  });
});
