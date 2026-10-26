import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { ShelterContacts } from './ShelterContacts';

const mocks = vi.hoisted(() => ({
  updateShelter: vi.fn(),
  showToast: vi.fn(),
  useShelterOperatorProfile: vi.fn(),
  useShelterPermissions: vi.fn(),
  useBaPrivatePermissions: vi.fn(),
  getFieldErrorsOrThrow: vi.fn(),
  applyFieldErrors: vi.fn(),
}));

vi.mock('../../../../../hooks', () => ({
  updateShelterProfileMeta: {},
  useShelterOperatorProfile: (shelterId: string) =>
    mocks.useShelterOperatorProfile(shelterId),
  useShelterPermissions: () => mocks.useShelterPermissions(),
  useBaPrivatePermissions: () => mocks.useBaPrivatePermissions(),
  useUpdateShelterProfile: () => ({ updateShelter: mocks.updateShelter }),
}));

vi.mock('../../../../base-ui/toast', () => ({
  useToast: () => ({ showToast: mocks.showToast }),
}));

vi.mock('@monorepo/ba-platform', () => ({
  BaError: class BaError extends Error {},
  getFieldErrorsOrThrow: (...args: unknown[]) =>
    mocks.getFieldErrorsOrThrow(...args),
}));

vi.mock('@monorepo/react/shared', async (importOriginal) => {
  const actual =
    await importOriginal<typeof import('@monorepo/react/shared')>();

  return {
    ...actual,
    applyFieldErrors: (...args: unknown[]) => mocks.applyFieldErrors(...args),
  };
});

// The list body is a separate concern; these cases are about the section shell
// (pencil, save/cancel, submit wiring), so only the view-mode flag is surfaced
// here.
vi.mock('./ShelterContactsForm', () => ({
  ShelterContactsForm: ({ isViewMode }: { isViewMode: boolean }) => (
    <div data-testid="contacts-form" data-view-mode={String(isViewMode)} />
  ),
}));

const SHELTER_ID = 'shelter-1';

const SHELTER = {
  id: SHELTER_ID,
  additionalContacts: [
    {
      id: '1',
      contactName: 'Jane Doe',
      contactNumber: '2135551234',
      // Empty strings, not nulls: the submit mapper must send null for these.
      contactEmail: '',
      contactTitle: '',
      isClaimant: true,
    },
  ],
};

function renderSection() {
  return render(<ShelterContacts shelterId={SHELTER_ID} />);
}

describe('ShelterContacts', () => {
  beforeEach(() => {
    mocks.updateShelter.mockReset();
    mocks.showToast.mockReset();
    mocks.useShelterOperatorProfile.mockReset();
    mocks.useShelterPermissions.mockReset();
    mocks.useBaPrivatePermissions.mockReset();
    mocks.getFieldErrorsOrThrow.mockReset();
    mocks.applyFieldErrors.mockReset();

    mocks.useShelterOperatorProfile.mockReturnValue({ shelter: SHELTER });
    mocks.useShelterPermissions.mockReturnValue({ canEditShelter: true });
    mocks.useBaPrivatePermissions.mockReturnValue({
      additionalContactsPermissions: { canView: true, canEdit: true },
    });
    mocks.getFieldErrorsOrThrow.mockReturnValue([]);
    mocks.updateShelter.mockResolvedValue({ data: {} });
  });

  it('saves the contacts and returns to view mode', async () => {
    renderSection();

    fireEvent.click(screen.getByRole('button'));
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() =>
      expect(mocks.updateShelter).toHaveBeenCalledWith({
        variables: {
          data: {
            id: SHELTER_ID,
            additionalContacts: [
              {
                id: '1',
                contactName: 'Jane Doe',
                contactNumber: '2135551234',
                contactEmail: null,
                contactTitle: null,
                isClaimant: true,
              },
            ],
          },
        },
      }),
    );

    expect(mocks.showToast).toHaveBeenCalledWith({
      status: 'success',
      title: 'Shelter updated.',
    });

    await waitFor(() =>
      expect(
        screen.getByTestId('contacts-form').getAttribute('data-view-mode'),
      ).toBe('true'),
    );
  });

  it('applies field errors and stays in edit mode', async () => {
    mocks.getFieldErrorsOrThrow.mockReturnValue([
      { field: 'additionalContacts.0.contactNumber', message: 'Invalid' },
    ]);

    const consoleError = vi
      .spyOn(console, 'error')
      .mockImplementation(() => undefined);

    renderSection();

    fireEvent.click(screen.getByRole('button'));
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() => expect(mocks.applyFieldErrors).toHaveBeenCalled());

    expect(mocks.showToast).toHaveBeenCalledWith({
      status: 'error',
      title: 'Update failed',
      description: 'Please see validation messages.',
    });
    expect(
      screen.getByTestId('contacts-form').getAttribute('data-view-mode'),
    ).toBe('false');

    consoleError.mockRestore();
  });

  it('leaves edit mode on cancel without saving', () => {
    renderSection();

    fireEvent.click(screen.getByRole('button'));
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(
      screen.getByTestId('contacts-form').getAttribute('data-view-mode'),
    ).toBe('true');
    expect(mocks.updateShelter).not.toHaveBeenCalled();
  });
});
