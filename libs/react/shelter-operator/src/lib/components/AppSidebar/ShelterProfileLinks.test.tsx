import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { ShelterProfileLinks } from './ShelterProfileLinks';

const mocks = vi.hoisted(() => ({
  useBaPrivatePermissions: vi.fn(),
}));

vi.mock('../../hooks', () => ({
  useBaPrivatePermissions: () => mocks.useBaPrivatePermissions(),
}));

function renderLinks() {
  return render(
    <MemoryRouter>
      <ShelterProfileLinks
        pathname="/operator/shelter/shelter-1/profile/basic-info"
        shelterId="shelter-1"
        isOpen
      />
    </MemoryRouter>,
  );
}

describe('ShelterProfileLinks', () => {
  beforeEach(() => {
    mocks.useBaPrivatePermissions.mockReset();
  });

  it('links the BA-private segment when the user can view a section', () => {
    mocks.useBaPrivatePermissions.mockReturnValue({ canViewAny: true });

    renderLinks();

    expect(screen.queryByText('BA Private')).not.toBeNull();
  });

  it('omits the BA-private link when the user can view no section', () => {
    mocks.useBaPrivatePermissions.mockReturnValue({ canViewAny: false });

    renderLinks();

    expect(screen.queryByText('BA Private')).toBeNull();
    // The rest of the profile links are unaffected by the gate.
    expect(screen.queryByText('Basic Info')).not.toBeNull();
    expect(screen.queryByText('Media')).not.toBeNull();
  });
});
