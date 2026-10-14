import { fireEvent, render, screen } from '@testing-library/react';
import { ShelterBaPrivate } from './ShelterBaPrivate';

const mocks = vi.hoisted(() => ({
  updateShelter: vi.fn(),
  showToast: vi.fn(),
  useShelterOperatorProfile: vi.fn(),
  useShelterPermissions: vi.fn(),
  useBaPrivatePermissions: vi.fn(),
}));

vi.mock('../../../../hooks', () => ({
  updateShelterProfileMeta: {},
  useShelterOperatorProfile: (shelterId: string) =>
    mocks.useShelterOperatorProfile(shelterId),
  useShelterPermissions: () => mocks.useShelterPermissions(),
  useBaPrivatePermissions: () => mocks.useBaPrivatePermissions(),
  useUpdateShelterProfile: () => ({ updateShelter: mocks.updateShelter }),
}));

vi.mock('../../../base-ui/toast', () => ({
  useToast: () => ({ showToast: mocks.showToast }),
}));

vi.mock('@monorepo/ba-platform', () => ({
  BaError: class BaError extends Error {},
  getFieldErrorsOrThrow: vi.fn(),
}));

// The contacts list is the section body; these cases are about the header's
// edit affordance, so only the prop that reflects view/edit mode is surfaced.
vi.mock('./Contacts/ShelterContacts', () => ({
  ShelterContacts: ({ isViewMode }: { isViewMode: boolean }) => (
    <div data-testid="contacts" data-view-mode={String(isViewMode)} />
  ),
}));

const SHELTER_ID = 'shelter-1';

function renderSegment() {
  return render(<ShelterBaPrivate shelterId={SHELTER_ID} />);
}

describe('ShelterBaPrivate edit affordance', () => {
  beforeEach(() => {
    mocks.updateShelter.mockReset();
    mocks.showToast.mockReset();
    mocks.useShelterOperatorProfile.mockReset();
    mocks.useShelterPermissions.mockReset();
    mocks.useBaPrivatePermissions.mockReset();

    mocks.useShelterOperatorProfile.mockReturnValue({
      shelter: { id: SHELTER_ID, additionalContacts: [] },
    });
    mocks.useShelterPermissions.mockReturnValue({ canEditShelter: true });
    mocks.useBaPrivatePermissions.mockReturnValue({
      additionalContactsPermissions: { canView: true, canEdit: true },
      canViewAny: true,
    });
  });

  it('offers edit when the org can edit the shelter and the role can change contacts', () => {
    renderSegment();

    const editButton = screen.queryByRole('button');
    expect(editButton).not.toBeNull();

    fireEvent.click(editButton as HTMLElement);

    expect(screen.getByTestId('contacts').getAttribute('data-view-mode')).toBe(
      'false',
    );
  });

  it('hides edit when the role cannot change contacts', () => {
    mocks.useBaPrivatePermissions.mockReturnValue({
      additionalContactsPermissions: { canView: true, canEdit: false },
      canViewAny: true,
    });

    renderSegment();

    // The backend refuses `additionalContacts` writes without the global
    // ContactInfo change permission, so offering the button would be a lie.
    expect(screen.queryByRole('button')).toBeNull();
  });

  it('hides edit when the org cannot edit the shelter', () => {
    mocks.useShelterPermissions.mockReturnValue({ canEditShelter: false });

    renderSegment();

    expect(screen.queryByRole('button')).toBeNull();
  });
});
