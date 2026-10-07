import { fireEvent, render, screen } from '@testing-library/react';
import {
  MemoryRouter,
  Route,
  Routes,
  useLocation,
  useNavigate,
} from 'react-router-dom';
import { paths, profileRouteConfig, shelterProfileRoute } from '../../routing';
import { BaPrivateGate } from './PermissionGate';

const mocks = vi.hoisted(() => ({
  useBaPrivatePermissions: vi.fn(),
}));

vi.mock('../../hooks', () => ({
  useBaPrivatePermissions: () => mocks.useBaPrivatePermissions(),
}));

const SHELTER_ID = 'shelter-1';

// Built from the routing config, not literals: the assertions are about which
// segment the gate lands on, so a path rename must not need a test edit.
const BA_PRIVATE_PATH = shelterProfileRoute(
  SHELTER_ID,
  profileRouteConfig.children.baPrivate,
);
const BASIC_INFO_PATH = shelterProfileRoute(
  SHELTER_ID,
  profileRouteConfig.children.basic,
);

function PathProbe() {
  return <div data-testid="path">{useLocation().pathname}</div>;
}

/** Stands in for Basic Info: reports the landing path and can go Back. */
function BasicInfoProbe() {
  const navigate = useNavigate();

  return (
    <>
      <PathProbe />
      <button type="button" onClick={() => navigate(-1)}>
        back
      </button>
    </>
  );
}

function renderAtBaPrivate(initialEntries: string[] = [BA_PRIVATE_PATH]) {
  return render(
    <MemoryRouter initialEntries={initialEntries}>
      <Routes>
        <Route path={paths.users} element={<PathProbe />} />
        <Route path={profileRouteConfig.root}>
          <Route
            path={profileRouteConfig.children.baPrivate}
            element={
              <BaPrivateGate>
                <div>ba private stand-in</div>
              </BaPrivateGate>
            }
          />
          <Route
            path={profileRouteConfig.children.basic}
            element={<BasicInfoProbe />}
          />
        </Route>
      </Routes>
    </MemoryRouter>,
  );
}

describe('BaPrivateGate', () => {
  beforeEach(() => {
    mocks.useBaPrivatePermissions.mockReset();
  });

  it('renders the segment when the user can view a section', () => {
    mocks.useBaPrivatePermissions.mockReturnValue({ canViewAny: true });

    renderAtBaPrivate();

    expect(screen.queryByText('ba private stand-in')).not.toBeNull();
    expect(screen.queryByTestId('path')).toBeNull();
  });

  it('falls back to Basic Info when the user can view no section', () => {
    mocks.useBaPrivatePermissions.mockReturnValue({ canViewAny: false });

    renderAtBaPrivate();

    expect(screen.queryByText('ba private stand-in')).toBeNull();
    expect(screen.getByTestId('path').textContent).toBe(BASIC_INFO_PATH);
  });

  it('carries the shelter id from the route into the fallback', () => {
    mocks.useBaPrivatePermissions.mockReturnValue({ canViewAny: false });
    const otherShelter = 'shelter-42';

    renderAtBaPrivate([
      shelterProfileRoute(otherShelter, profileRouteConfig.children.baPrivate),
    ]);

    expect(screen.getByTestId('path').textContent).toBe(
      shelterProfileRoute(otherShelter, profileRouteConfig.children.basic),
    );
  });

  it('replaces the entry so Back does not bounce between the segments', () => {
    mocks.useBaPrivatePermissions.mockReturnValue({ canViewAny: false });

    renderAtBaPrivate([paths.users, BA_PRIVATE_PATH]);
    fireEvent.click(screen.getByRole('button', { name: 'back' }));

    expect(screen.getByTestId('path').textContent).toBe(paths.users);
  });
});
