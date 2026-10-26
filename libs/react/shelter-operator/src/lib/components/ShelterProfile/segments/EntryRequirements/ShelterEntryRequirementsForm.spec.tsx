import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import type { UseFormSetError } from 'react-hook-form';
import { type EntryRequirementsFormData } from './formSchema';
import { ShelterEntryRequirementsForm } from './ShelterEntryRequirementsForm';

// TipTap needs a real contenteditable environment; this spec is about how the
// form state follows the `values` prop, so the editor is irrelevant.
vi.mock('../../../base-ui/richTextEditor', () => ({
  RichTextEditor: () => null,
}));

const bedFeesInput = () =>
  screen.getByLabelText('Bed Fees') as HTMLInputElement;

const onSubmitNoop = () => undefined;

describe('ShelterEntryRequirementsForm', () => {
  it('re-syncs field values when the values prop changes (post-save refetch)', async () => {
    const { rerender } = render(
      <ShelterEntryRequirementsForm
        values={{ bedFees: 'Free' }}
        onSubmit={onSubmitNoop}
      />,
    );

    expect(bedFeesInput().value).toBe('Free');

    rerender(
      <ShelterEntryRequirementsForm
        values={{ bedFees: '$10/night' }}
        onSubmit={onSubmitNoop}
      />,
    );

    await waitFor(() => expect(bedFeesInput().value).toBe('$10/night'));
  });

  it('keeps in-progress edits when the values content is unchanged', async () => {
    const { rerender } = render(
      <ShelterEntryRequirementsForm
        values={{ bedFees: 'Free' }}
        onSubmit={onSubmitNoop}
      />,
    );

    fireEvent.change(bedFeesInput(), { target: { value: '$5/night' } });

    expect(bedFeesInput().value).toBe('$5/night');

    // Re-render with deep-equal data, e.g. a failed submit that refetches
    // nothing: the user's edits must survive.
    rerender(
      <ShelterEntryRequirementsForm
        values={{ bedFees: 'Free' }}
        onSubmit={onSubmitNoop}
      />,
    );

    await waitFor(() => expect(bedFeesInput().value).toBe('$5/night'));
  });

  it('clears a field error when the values prop changes', async () => {
    const onSubmit = (
      _data: EntryRequirementsFormData,
      setError: UseFormSetError<EntryRequirementsFormData>,
    ) => {
      setError('bedFees', { type: 'server', message: 'Server rejected' });
    };

    const { rerender } = render(
      <ShelterEntryRequirementsForm
        values={{ bedFees: 'Free' }}
        onSubmit={onSubmit}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Save' }));

    expect(await screen.findByText('Server rejected')).toBeTruthy();

    rerender(
      <ShelterEntryRequirementsForm
        values={{ bedFees: '$10/night' }}
        onSubmit={onSubmit}
      />,
    );

    await waitFor(() =>
      expect(screen.queryByText('Server rejected')).toBeNull(),
    );
  });

  it('restores the values prop on cancel', async () => {
    render(
      <ShelterEntryRequirementsForm
        values={{ bedFees: 'Free' }}
        onSubmit={onSubmitNoop}
      />,
    );

    fireEvent.change(bedFeesInput(), { target: { value: '$5/night' } });

    expect(bedFeesInput().value).toBe('$5/night');

    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));

    await waitFor(() => expect(bedFeesInput().value).toBe('Free'));
  });
});
