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

// The contacts section owns its own header/edit tests; here we only care that
// the right section is mounted, so just the view-mode flag is surfaced.
vi.mock('./Contacts/ShelterContactsForm', () => ({
  ShelterContactsForm: ({ isViewMode }: { isViewMode: boolean }) => (
    <div data-testid="contacts" data-view-mode={String(isViewMode)} />
  ),
}));

vi.mock('./Review', () => ({
  ShelterReview: () => <div data-testid="review" />,
}));

const SHELTER_ID = 'shelter-1';

function renderSegment() {
  return render(<ShelterBaPrivate shelterId={SHELTER_ID} />);
}

describe('ShelterBaPrivate tabs', () => {
  beforeEach(() => {
    mocks.useShelterOperatorProfile.mockReset();
    mocks.useShelterPermissions.mockReset();
    mocks.useBaPrivatePermissions.mockReset();

    mocks.useShelterOperatorProfile.mockReturnValue({
      shelter: { id: SHELTER_ID, additionalContacts: [] },
    });
    mocks.useShelterPermissions.mockReturnValue({ canEditShelter: true });
    mocks.useBaPrivatePermissions.mockReturnValue({
      additionalContactsPermissions: { canView: true, canEdit: true },
      baReviewPermissions: { canView: true, canEdit: true },
      canViewAny: true,
    });
  });

  it('renders nothing when the user can view no section', () => {
    mocks.useBaPrivatePermissions.mockReturnValue({
      additionalContactsPermissions: { canView: false, canEdit: false },
      baReviewPermissions: { canView: false, canEdit: false },
      canViewAny: false,
    });

    const { container } = renderSegment();

    // The route gate already bounced this user; the segment must not fall back
    // to rendering a section whose backend data is withheld.
    expect(container.innerHTML).toBe('');
  });

  it('offers only the contacts tab when the role cannot view the review', () => {
    mocks.useBaPrivatePermissions.mockReturnValue({
      additionalContactsPermissions: { canView: true, canEdit: true },
      baReviewPermissions: { canView: false, canEdit: false },
      canViewAny: true,
    });

    renderSegment();

    expect(screen.queryByRole('tab', { name: 'Review' })).toBeNull();
    expect(screen.queryByTestId('review')).toBeNull();
    expect(screen.queryByTestId('contacts')).not.toBeNull();
  });

  it('switches to the review tab', () => {
    renderSegment();

    fireEvent.click(screen.getByRole('tab', { name: 'Review' }));

    expect(screen.queryByTestId('review')).not.toBeNull();
    expect(screen.queryByTestId('contacts')).toBeNull();
  });

  it('falls back to the first visible section when contacts are withheld', () => {
    mocks.useBaPrivatePermissions.mockReturnValue({
      additionalContactsPermissions: { canView: false, canEdit: false },
      baReviewPermissions: { canView: true, canEdit: true },
      canViewAny: true,
    });

    renderSegment();

    expect(screen.queryByTestId('review')).not.toBeNull();
    expect(screen.queryByTestId('contacts')).toBeNull();
  });
});
