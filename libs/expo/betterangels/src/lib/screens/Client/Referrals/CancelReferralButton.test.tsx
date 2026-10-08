/**
 * Cancel abandons the draft, so it must confirm — the regression this guards is
 * a resumed referral being destroyed by a single tap on Cancel.
 */
import '@testing-library/react-native/build/matchers/extend-expect';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { uiComponents } from '../../../../__mocks__/sharedBarrels';
import { CancelReferralButton } from './CancelReferralButton';

vi.mock('@monorepo/expo/shared/ui-components', () => uiComponents());

it('asks for confirmation instead of discarding on the first tap', () => {
  const onCancel = vi.fn();
  render(<CancelReferralButton testID="cancel-btn" onCancel={onCancel} />);

  fireEvent.press(screen.getByTestId('cancel-btn'));

  expect(screen.getByText('Discard referral?')).toBeOnTheScreen();
  expect(onCancel).not.toHaveBeenCalled();
});

it('discards only after the confirmation', () => {
  const onCancel = vi.fn();
  render(<CancelReferralButton testID="cancel-btn" onCancel={onCancel} />);

  fireEvent.press(screen.getByTestId('cancel-btn'));
  fireEvent.press(screen.getByTestId('discard-modal-confirm'));

  expect(onCancel).toHaveBeenCalledTimes(1);
});

it('keeps the draft when the confirmation is dismissed', () => {
  const onCancel = vi.fn();
  render(<CancelReferralButton testID="cancel-btn" onCancel={onCancel} />);

  fireEvent.press(screen.getByTestId('cancel-btn'));
  fireEvent.press(screen.getByTestId('discard-modal-cancel'));

  expect(onCancel).not.toHaveBeenCalled();
});
