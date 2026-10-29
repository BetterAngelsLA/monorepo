import { ExitPolicyChoices } from '@monorepo/react/shelter';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import type { UseFormSetError } from 'react-hook-form';
import { defaultFormValues, type PoliciesFormData } from './formSchema';
import { ShelterPoliciesForm } from './ShelterPoliciesForm';

// TipTap needs a real contenteditable environment; this spec is about how the
// form state follows the `values` prop, so the editor is irrelevant.
vi.mock('../../../base-ui/richTextEditor', () => ({
  RichTextEditor: () => null,
}));

const maxStayInput = () =>
  screen.getByLabelText('Maximum Stay (days)') as HTMLInputElement;

const onSubmitNoop = () => undefined;

describe('ShelterPoliciesForm', () => {
  it('re-syncs field values when the values prop changes (post-save refetch)', async () => {
    const { rerender } = render(
      <ShelterPoliciesForm values={{ maxStay: 10 }} onSubmit={onSubmitNoop} />,
    );

    expect(maxStayInput().value).toBe('10');

    rerender(
      <ShelterPoliciesForm values={{ maxStay: 20 }} onSubmit={onSubmitNoop} />,
    );

    await waitFor(() => expect(maxStayInput().value).toBe('20'));
  });

  it('keeps in-progress edits when the values content is unchanged', async () => {
    const { rerender } = render(
      <ShelterPoliciesForm values={{ maxStay: 10 }} onSubmit={onSubmitNoop} />,
    );

    fireEvent.change(maxStayInput(), { target: { value: '30' } });

    expect(maxStayInput().value).toBe('30');

    // Re-render with deep-equal data, e.g. a failed submit that refetches
    // nothing: the user's edits must survive.
    rerender(
      <ShelterPoliciesForm values={{ maxStay: 10 }} onSubmit={onSubmitNoop} />,
    );

    await waitFor(() => expect(maxStayInput().value).toBe('30'));
  });

  it('clears a field error when the values prop changes', async () => {
    const onSubmit = (
      _data: PoliciesFormData,
      setError: UseFormSetError<PoliciesFormData>,
    ) => {
      setError('maxStay', { type: 'server', message: 'Server rejected' });
    };

    const { rerender } = render(
      <ShelterPoliciesForm values={{ maxStay: 10 }} onSubmit={onSubmit} />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Save' }));

    expect(await screen.findByText('Server rejected')).toBeTruthy();

    rerender(
      <ShelterPoliciesForm values={{ maxStay: 12 }} onSubmit={onSubmit} />,
    );

    await waitFor(() =>
      expect(screen.queryByText('Server rejected')).toBeNull(),
    );
  });

  it('restores the values prop on cancel', async () => {
    render(
      <ShelterPoliciesForm values={{ maxStay: 10 }} onSubmit={onSubmitNoop} />,
    );

    fireEvent.change(maxStayInput(), { target: { value: '99' } });

    expect(maxStayInput().value).toBe('99');

    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));

    await waitFor(() => expect(maxStayInput().value).toBe('10'));
  });

  it('does not require exitPolicyOther when Other is not selected', async () => {
    const onSubmit = vi.fn();

    render(
      <ShelterPoliciesForm
        values={{ ...defaultFormValues, maxStay: 10 }}
        onSubmit={onSubmit}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() => expect(onSubmit).toHaveBeenCalled());
  });

  it('requires exitPolicyOther when Other is selected', async () => {
    const onSubmit = vi.fn();

    render(
      <ShelterPoliciesForm
        values={{
          ...defaultFormValues,
          maxStay: 10,
          exitPolicy: [ExitPolicyChoices.Other],
        }}
        onSubmit={onSubmit}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Save' }));

    expect(
      await screen.findByText(
        "This field is required when 'Other' is selected.",
      ),
    ).toBeTruthy();
    expect(onSubmit).not.toHaveBeenCalled();
  });
});
