import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import type { ShelterProfileType } from '../../../types';
import { ShelterReview } from './ShelterReview';
import { toFormData } from './formSchema';

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

// The form's own rendering is a separate concern. These cases are about the
// section: who sees it, who gets the pencil, and how the save round-trip is
// wired — so the stub surfaces exactly those props.
vi.mock('./ShelterReviewForm', () => ({
  ShelterReviewForm: (props: {
    isViewMode: boolean;
    onEditClick?: () => void;
    onCancel?: () => void;
    onSubmit: (data: unknown, setError: unknown) => void;
  }) => (
    <div data-testid="review-form" data-view-mode={String(props.isViewMode)}>
      {props.onEditClick && (
        <button onClick={props.onEditClick}>edit review</button>
      )}

      {!props.isViewMode && (
        <>
          <button
            onClick={() =>
              props.onSubmit(
                {
                  overallRating: 4,
                  declinedBaVisit: true,
                  subjectiveReview: 'Solid',
                },
                vi.fn(),
              )
            }
          >
            submit review
          </button>
          <button onClick={props.onCancel}>cancel review</button>
        </>
      )}
    </div>
  ),
}));

const SHELTER_ID = 'shelter-1';

function renderSection() {
  return render(<ShelterReview shelterId={SHELTER_ID} />);
}

function enterEditMode() {
  fireEvent.click(screen.getByRole('button', { name: 'edit review' }));
}

describe('ShelterReview', () => {
  beforeEach(() => {
    mocks.updateShelter.mockReset();
    mocks.showToast.mockReset();
    mocks.useShelterOperatorProfile.mockReset();
    mocks.useShelterPermissions.mockReset();
    mocks.useBaPrivatePermissions.mockReset();
    mocks.getFieldErrorsOrThrow.mockReset();
    mocks.applyFieldErrors.mockReset();

    mocks.useShelterOperatorProfile.mockReturnValue({
      shelter: {
        id: SHELTER_ID,
        overallRating: null,
        declinedBaVisit: null,
        subjectiveReview: null,
      },
    });
    mocks.useShelterPermissions.mockReturnValue({ canEditShelter: true });
    mocks.useBaPrivatePermissions.mockReturnValue({
      baReviewPermissions: { canView: true, canEdit: true },
    });
    mocks.getFieldErrorsOrThrow.mockReturnValue([]);
    mocks.updateShelter.mockResolvedValue({ data: {} });
  });

  it('seeds the form with inert values for review fields the shelter has not set', () => {
    // `declined_ba_visit` / `subjective_review` are nullable model columns: an
    // authorized viewer still gets null for a shelter nobody has reviewed.
    expect(
      toFormData({
        overallRating: null,
        declinedBaVisit: null,
        subjectiveReview: null,
      } as unknown as ShelterProfileType),
    ).toEqual({
      overallRating: null,
      declinedBaVisit: false,
      subjectiveReview: '',
    });
  });

  it('renders nothing when the role cannot view the review', () => {
    mocks.useBaPrivatePermissions.mockReturnValue({
      baReviewPermissions: { canView: false, canEdit: false },
    });

    const { container } = renderSection();

    // `can_globally(Shelter.VIEW_BA_REVIEW)` fails on the backend too: the
    // fields come back null, so rendering them would be a lie.
    expect(container.innerHTML).toBe('');
  });

  it('hides the pencil when the org cannot edit the shelter', () => {
    mocks.useShelterPermissions.mockReturnValue({ canEditShelter: false });

    renderSection();

    expect(screen.queryByRole('button')).toBeNull();
  });

  it('hides the pencil when the role can view but not change the review', () => {
    mocks.useBaPrivatePermissions.mockReturnValue({
      baReviewPermissions: { canView: true, canEdit: false },
    });

    renderSection();

    expect(screen.queryByRole('button')).toBeNull();
  });

  it('leaves edit mode on cancel without saving', () => {
    renderSection();

    enterEditMode();
    fireEvent.click(screen.getByRole('button', { name: 'cancel review' }));

    expect(
      screen.getByTestId('review-form').getAttribute('data-view-mode'),
    ).toBe('true');
    expect(mocks.updateShelter).not.toHaveBeenCalled();
  });

  it('submits the review fields and returns to view mode', async () => {
    renderSection();

    enterEditMode();
    fireEvent.click(screen.getByRole('button', { name: 'submit review' }));

    await waitFor(() =>
      expect(mocks.updateShelter).toHaveBeenCalledWith({
        variables: {
          data: {
            id: SHELTER_ID,
            overallRating: 4,
            declinedBaVisit: true,
            subjectiveReview: 'Solid',
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
        screen.getByTestId('review-form').getAttribute('data-view-mode'),
      ).toBe('true'),
    );
  });

  it('applies field errors and stays in edit mode', async () => {
    mocks.getFieldErrorsOrThrow.mockReturnValue([
      { field: 'subjectiveReview', message: 'Required' },
    ]);

    const consoleError = vi
      .spyOn(console, 'error')
      .mockImplementation(() => undefined);

    renderSection();

    enterEditMode();
    fireEvent.click(screen.getByRole('button', { name: 'submit review' }));

    await waitFor(() => expect(mocks.applyFieldErrors).toHaveBeenCalled());

    expect(mocks.showToast).toHaveBeenCalledWith({
      status: 'error',
      title: 'Update failed',
      description: 'Please see validation messages.',
    });
    expect(
      screen.getByTestId('review-form').getAttribute('data-view-mode'),
    ).toBe('false');

    consoleError.mockRestore();
  });
});
