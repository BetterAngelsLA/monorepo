import { RoomStyleChoices } from '@monorepo/react/shelter';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { ShelterSleepingDetailsForm } from './ShelterSleepingDetailsForm';

// TipTap needs a real contenteditable environment; this spec is about how the
// form state follows the `values` prop, so the editor is irrelevant.
vi.mock('../../../base-ui/richTextEditor', () => ({
  RichTextEditor: () => null,
}));

const totalBedsInput = () =>
  screen.getByLabelText('Total Beds') as HTMLInputElement;

const unrestrictedBedsInput = () =>
  screen.getByLabelText('Available Unrestricted Beds') as HTMLInputElement;

const restrictedBedsInput = () =>
  screen.getByLabelText('Available Restricted Beds') as HTMLInputElement;

const restrictionNotesInput = () =>
  screen.getByLabelText('Restriction Notes') as HTMLTextAreaElement;

const valuesWithOther = (roomStylesOther?: string) => ({
  roomStyles: [RoomStyleChoices.Other],
  roomStylesOther,
});

const onSubmitNoop = () => undefined;

describe('ShelterSleepingDetailsForm', () => {
  it('re-syncs field values when the values prop changes (post-save refetch)', async () => {
    const { rerender } = render(
      <ShelterSleepingDetailsForm
        values={{ totalBeds: 10 }}
        onSubmit={onSubmitNoop}
      />,
    );

    expect(totalBedsInput().value).toBe('10');

    rerender(
      <ShelterSleepingDetailsForm
        values={{ totalBeds: 20 }}
        onSubmit={onSubmitNoop}
      />,
    );

    await waitFor(() => expect(totalBedsInput().value).toBe('20'));
  });

  it('keeps in-progress edits when the values content is unchanged', async () => {
    const { rerender } = render(
      <ShelterSleepingDetailsForm
        values={{ totalBeds: 10 }}
        onSubmit={onSubmitNoop}
      />,
    );

    fireEvent.change(totalBedsInput(), { target: { value: '30' } });

    expect(totalBedsInput().value).toBe('30');

    // Re-render with deep-equal data, e.g. a failed submit that refetches
    // nothing: the user's edits must survive.
    rerender(
      <ShelterSleepingDetailsForm
        values={{ totalBeds: 10 }}
        onSubmit={onSubmitNoop}
      />,
    );

    await waitFor(() => expect(totalBedsInput().value).toBe('30'));
  });

  it('clears a field error when the values prop changes', async () => {
    const { rerender } = render(
      <ShelterSleepingDetailsForm
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
      <ShelterSleepingDetailsForm
        values={valuesWithOther('Dorm')}
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
      <ShelterSleepingDetailsForm
        values={{ totalBeds: 10 }}
        onSubmit={onSubmitNoop}
      />,
    );

    fireEvent.change(totalBedsInput(), { target: { value: '99' } });

    expect(totalBedsInput().value).toBe('99');

    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));

    await waitFor(() => expect(totalBedsInput().value).toBe('10'));
  });
});

describe('ShelterSleepingDetailsForm availability', () => {
  it('renders the availability values', () => {
    render(
      <ShelterSleepingDetailsForm
        values={{
          nonRestrictedBeds: 3,
          restrictedBeds: 2,
          restrictionNotes: 'Women only',
        }}
        onSubmit={onSubmitNoop}
      />,
    );

    expect(unrestrictedBedsInput().value).toBe('3');
    expect(restrictedBedsInput().value).toBe('2');
    expect(restrictionNotesInput().value).toBe('Women only');
  });

  it('updates a counter on change', () => {
    render(
      <ShelterSleepingDetailsForm
        values={{ nonRestrictedBeds: 3, restrictedBeds: 2 }}
        onSubmit={onSubmitNoop}
      />,
    );

    fireEvent.change(restrictedBedsInput(), { target: { value: '5' } });

    expect(restrictedBedsInput().value).toBe('5');
  });

  it('blocks save when the counts exceed the total beds', async () => {
    const onSubmit = vi.fn();

    render(
      <ShelterSleepingDetailsForm
        values={{ totalBeds: 4, nonRestrictedBeds: 3, restrictedBeds: 2 }}
        onSubmit={onSubmit}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Save' }));

    // The cap is rendered on both counters, so two nodes carry the message.
    expect(
      await screen.findAllByText(
        "Unrestricted + restricted beds (5) cannot exceed the shelter's total beds (4).",
      ),
    ).toHaveLength(2);
    expect(onSubmit).not.toHaveBeenCalled();
  });
});
