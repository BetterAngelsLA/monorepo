/**
 * Cancel abandons the draft, so it must confirm — the regression this guards is
 * a resumed referral being destroyed by a single tap on Cancel.
 */
import { fireEvent, render, screen } from '@testing-library/react-native';
import { uiComponents } from '../../../../__mocks__/sharedBarrels';
import { CancelReferralButton } from './CancelReferralButton';

vi.mock('@monorepo/expo/shared/ui-components', () => uiComponents());

it('asks for confirmation instead of discarding on the first tap', async () => {
  const onCancel = vi.fn();
  await render(
    <CancelReferralButton testID="cancel-btn" onCancel={onCancel} />,
  );

  await fireEvent.press(screen.getByTestId('cancel-btn'));

  expect(screen.getByText('Discard referral?')).toBeOnTheScreen();
  expect(onCancel).not.toHaveBeenCalled();
});

it('explains that discarding edit changes leaves the saved referral unchanged', async () => {
  const onCancel = vi.fn();
  await render(
    <CancelReferralButton testID="cancel-btn" onCancel={onCancel} editing />,
  );
  const cancel = screen.getByRole('button', {
    name: 'cancel referral changes',
  });
  expect(cancel.props.accessibilityHint).toContain('without deleting');
  await fireEvent.press(cancel);
  expect(screen.getByText('Discard unsaved changes?')).toBeOnTheScreen();
  expect(
    screen.getByText('The saved referral will remain unchanged.'),
  ).toBeOnTheScreen();
  expect(screen.queryByText('Discard referral?')).toBeNull();
  expect(onCancel).not.toHaveBeenCalled();
});

it.each([false, true])(
  'discards only after confirmation, editing=%s',
  async (editing) => {
    const onCancel = vi.fn();
    await render(
      <CancelReferralButton
        testID="cancel-btn"
        onCancel={onCancel}
        editing={editing}
      />,
    );

    await fireEvent.press(screen.getByTestId('cancel-btn'));
    await fireEvent.press(screen.getByTestId('discard-modal-confirm'));

    expect(onCancel).toHaveBeenCalledTimes(1);
  },
);

it.each([false, true])(
  'keeps the draft when confirmation is dismissed, editing=%s',
  async (editing) => {
    const onCancel = vi.fn();
    await render(
      <CancelReferralButton
        testID="cancel-btn"
        onCancel={onCancel}
        editing={editing}
      />,
    );

    await fireEvent.press(screen.getByTestId('cancel-btn'));
    await fireEvent.press(screen.getByTestId('discard-modal-cancel'));

    expect(onCancel).not.toHaveBeenCalled();
  },
);
