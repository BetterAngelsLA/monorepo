import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { ShelterBasicInfoForm } from './ShelterBasicInfoForm';

// TipTap needs a real contenteditable environment; this spec is about how the
// form state follows the `values` prop, so the editor is irrelevant.
vi.mock('../../../base-ui/richTextEditor', () => ({
  RichTextEditor: () => null,
}));

// The location picker is a map widget; same reasoning as the editor above.
vi.mock('../../../../pages/dashboard/components/LocationPicker', () => ({
  LocationPicker: () => null,
}));

// The label renders a `*` for required fields, so match on the prefix.
const nameInput = () => screen.getByLabelText(/^Name/) as HTMLInputElement;
const emailInput = () => screen.getByLabelText('Email') as HTMLInputElement;

const onSubmitNoop = () => undefined;

describe('ShelterBasicInfoForm', () => {
  it('re-syncs field values when the values prop changes (post-save refetch)', async () => {
    const { rerender } = render(
      <ShelterBasicInfoForm
        values={{ name: 'Alpha House' }}
        onSubmit={onSubmitNoop}
      />,
    );

    expect(nameInput().value).toBe('Alpha House');

    rerender(
      <ShelterBasicInfoForm
        values={{ name: 'Beta House' }}
        onSubmit={onSubmitNoop}
      />,
    );

    await waitFor(() => expect(nameInput().value).toBe('Beta House'));
  });

  it('keeps in-progress edits when the values content is unchanged', async () => {
    const { rerender } = render(
      <ShelterBasicInfoForm
        values={{ name: 'Alpha House' }}
        onSubmit={onSubmitNoop}
      />,
    );

    fireEvent.change(nameInput(), { target: { value: 'Edited House' } });

    expect(nameInput().value).toBe('Edited House');

    // Re-render with deep-equal data, e.g. a failed submit that refetches
    // nothing: the user's edits must survive.
    rerender(
      <ShelterBasicInfoForm
        values={{ name: 'Alpha House' }}
        onSubmit={onSubmitNoop}
      />,
    );

    await waitFor(() => expect(nameInput().value).toBe('Edited House'));
  });

  it('clears a field error when the values prop changes', async () => {
    const { rerender } = render(
      <ShelterBasicInfoForm
        values={{ name: 'Alpha House' }}
        onSubmit={onSubmitNoop}
      />,
    );

    fireEvent.change(emailInput(), { target: { value: 'not-an-email' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));

    expect(
      await screen.findByText('Please enter a valid email address'),
    ).toBeTruthy();

    rerender(
      <ShelterBasicInfoForm
        values={{ name: 'Beta House' }}
        onSubmit={onSubmitNoop}
      />,
    );

    await waitFor(() =>
      expect(
        screen.queryByText('Please enter a valid email address'),
      ).toBeNull(),
    );
  });

  it('restores the values prop on cancel', async () => {
    render(
      <ShelterBasicInfoForm
        values={{ name: 'Alpha House' }}
        onSubmit={onSubmitNoop}
      />,
    );

    fireEvent.change(nameInput(), { target: { value: 'Edited House' } });

    expect(nameInput().value).toBe('Edited House');

    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));

    await waitFor(() => expect(nameInput().value).toBe('Alpha House'));
  });
});
