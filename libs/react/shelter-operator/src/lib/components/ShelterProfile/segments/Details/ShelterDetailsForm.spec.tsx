import { DemographicChoices } from '@monorepo/react/shelter';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { ShelterDetailsForm } from './ShelterDetailsForm';

// TipTap needs a real contenteditable environment; this spec is about how the
// form state follows the `values` prop, so the editor is irrelevant.
vi.mock('../../../base-ui/richTextEditor', () => ({
  RichTextEditor: () => null,
}));

// Every plain field on this form is a dropdown, so the ComboBox's conditional
// "Other" input is used as the observable text field.
const otherDemographicInput = () =>
  screen.getByLabelText('Other Demographic') as HTMLInputElement;

const valuesWithOther = (demographicsOther?: string) => ({
  demographics: [DemographicChoices.Other],
  demographicsOther,
});

const onSubmitNoop = () => undefined;

describe('ShelterDetailsForm', () => {
  it('re-syncs field values when the values prop changes (post-save refetch)', async () => {
    const { rerender } = render(
      <ShelterDetailsForm
        values={valuesWithOther('Women')}
        onSubmit={onSubmitNoop}
      />,
    );

    expect(otherDemographicInput().value).toBe('Women');

    rerender(
      <ShelterDetailsForm
        values={valuesWithOther('Youth')}
        onSubmit={onSubmitNoop}
      />,
    );

    await waitFor(() => expect(otherDemographicInput().value).toBe('Youth'));
  });

  it('keeps in-progress edits when the values content is unchanged', async () => {
    const { rerender } = render(
      <ShelterDetailsForm
        values={valuesWithOther('Women')}
        onSubmit={onSubmitNoop}
      />,
    );

    fireEvent.change(otherDemographicInput(), {
      target: { value: 'Families' },
    });

    expect(otherDemographicInput().value).toBe('Families');

    // Re-render with deep-equal data, e.g. a failed submit that refetches
    // nothing: the user's edits must survive.
    rerender(
      <ShelterDetailsForm
        values={valuesWithOther('Women')}
        onSubmit={onSubmitNoop}
      />,
    );

    await waitFor(() => expect(otherDemographicInput().value).toBe('Families'));
  });

  it('clears a field error when the values prop changes', async () => {
    const { rerender } = render(
      <ShelterDetailsForm values={valuesWithOther()} onSubmit={onSubmitNoop} />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Save' }));

    expect(
      await screen.findByText(
        "This field is required when 'Other' is selected.",
      ),
    ).toBeTruthy();

    rerender(
      <ShelterDetailsForm
        values={valuesWithOther('Youth')}
        onSubmit={onSubmitNoop}
      />,
    );

    await waitFor(() =>
      expect(
        screen.queryByText("This field is required when 'Other' is selected."),
      ).toBeNull(),
    );
  });

  it('restores the values prop on cancel', async () => {
    render(
      <ShelterDetailsForm
        values={valuesWithOther('Women')}
        onSubmit={onSubmitNoop}
      />,
    );

    fireEvent.change(otherDemographicInput(), {
      target: { value: 'Families' },
    });

    expect(otherDemographicInput().value).toBe('Families');

    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));

    await waitFor(() => expect(otherDemographicInput().value).toBe('Women'));
  });
});
