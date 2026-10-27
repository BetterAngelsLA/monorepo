import { FunderChoices } from '@monorepo/react/shelter';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { ShelterEcosystemForm } from './ShelterEcosystemForm';

vi.mock('../../../../hooks', () => ({
  useShelterCities: () => ({ cities: [] }),
}));

vi.mock('../../../../hooks/useShelterSpas/useShelterSpas', () => ({
  useShelterSpas: () => ({ spas: [] }),
}));

// Every plain field on this form is a dropdown, so the ComboBox's conditional
// "Other" input is used as the observable text field.
const otherFunderInput = () =>
  screen.getByLabelText('Other Funder') as HTMLInputElement;

const valuesWithOther = (fundersOther?: string) => ({
  funders: [FunderChoices.Other],
  fundersOther,
});

const onSubmitNoop = () => undefined;

describe('ShelterEcosystemForm', () => {
  it('re-syncs field values when the values prop changes (post-save refetch)', async () => {
    const { rerender } = render(
      <ShelterEcosystemForm
        values={valuesWithOther('County')}
        onSubmit={onSubmitNoop}
      />,
    );

    expect(otherFunderInput().value).toBe('County');

    rerender(
      <ShelterEcosystemForm
        values={valuesWithOther('State')}
        onSubmit={onSubmitNoop}
      />,
    );

    await waitFor(() => expect(otherFunderInput().value).toBe('State'));
  });

  it('keeps in-progress edits when the values content is unchanged', async () => {
    const { rerender } = render(
      <ShelterEcosystemForm
        values={valuesWithOther('County')}
        onSubmit={onSubmitNoop}
      />,
    );

    fireEvent.change(otherFunderInput(), { target: { value: 'City' } });

    expect(otherFunderInput().value).toBe('City');

    // Re-render with deep-equal data, e.g. a failed submit that refetches
    // nothing: the user's edits must survive.
    rerender(
      <ShelterEcosystemForm
        values={valuesWithOther('County')}
        onSubmit={onSubmitNoop}
      />,
    );

    await waitFor(() => expect(otherFunderInput().value).toBe('City'));
  });

  it('clears a field error when the values prop changes', async () => {
    const { rerender } = render(
      <ShelterEcosystemForm
        values={valuesWithOther()}
        onSubmit={onSubmitNoop}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Save' }));

    expect(
      await screen.findByText(
        "This field is required when 'Other' is selected.",
      ),
    ).toBeTruthy();

    rerender(
      <ShelterEcosystemForm
        values={valuesWithOther('State')}
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
      <ShelterEcosystemForm
        values={valuesWithOther('County')}
        onSubmit={onSubmitNoop}
      />,
    );

    fireEvent.change(otherFunderInput(), { target: { value: 'City' } });

    expect(otherFunderInput().value).toBe('City');

    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));

    await waitFor(() => expect(otherFunderInput().value).toBe('County'));
  });
});
