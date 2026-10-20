import { fireEvent, render, screen } from '@testing-library/react-native';
import { uiComponents } from '../../../../__mocks__/sharedBarrels';
import { ReferralDraftRetention } from './ReferralDraftRetention';

const { discard } = vi.hoisted(() => ({ discard: vi.fn() }));
vi.mock('@monorepo/expo/shared/ui-components', () => uiComponents());
vi.mock('../../../draft/referralDraftStorage', () => ({
  discardAccountReferralDrafts: discard,
}));

afterEach(() => {
  vi.restoreAllMocks();
  discard.mockReset();
});

const account = { apiUrl: 'https://test-api', userId: 'user-1' };
const openConfirmation = () =>
  fireEvent.press(screen.getByText('Remove my local referral drafts'));

it('explains retention and removes only the supplied account after confirmation', async () => {
  await render(<ReferralDraftRetention account={account} />);
  expect(
    screen.getByText(/stay on this device after sign-out/),
  ).toBeOnTheScreen();

  await openConfirmation();
  expect(discard).not.toHaveBeenCalled();

  await fireEvent.press(screen.getByTestId('discard-modal-confirm'));
  expect(discard).toHaveBeenCalledWith(account);
  expect(
    screen.getByText('Your local referral drafts were removed.'),
  ).toBeOnTheScreen();
});

it('reports a failed removal without claiming success', async () => {
  discard.mockImplementation(() => {
    throw new Error('disk unavailable');
  });
  await render(<ReferralDraftRetention account={account} />);

  await openConfirmation();
  await fireEvent.press(screen.getByTestId('discard-modal-confirm'));

  expect(
    screen.getByText('Some drafts could not be removed. Please try again.'),
  ).toBeOnTheScreen();
});

it.each([
  { apiUrl: 'https://other-api', userId: 'user-1' },
  { apiUrl: 'https://test-api', userId: 'user-2' },
])(
  'closes a confirmation that belonged to the previous account: %j',
  async (nextAccount) => {
    const view = await render(<ReferralDraftRetention account={account} />);
    await openConfirmation();
    expect(screen.getByTestId('discard-modal-confirm')).toBeOnTheScreen();

    await view.rerender(<ReferralDraftRetention account={nextAccount} />);

    // Remounted for the new identity: the old confirmation is gone, and no
    // stale press can act on the new account.
    expect(screen.queryByTestId('discard-modal-confirm')).toBeNull();
    expect(discard).not.toHaveBeenCalled();
  },
);

it('does not revive the confirmation when the original account returns', async () => {
  const view = await render(<ReferralDraftRetention account={account} />);
  await openConfirmation();
  await view.rerender(
    <ReferralDraftRetention account={{ ...account, userId: 'user-2' }} />,
  );
  await view.rerender(<ReferralDraftRetention account={account} />);

  expect(screen.queryByTestId('discard-modal-confirm')).toBeNull();
  expect(discard).not.toHaveBeenCalled();
});

it('revokes an open confirmation when its screen unmounts', async () => {
  const view = await render(<ReferralDraftRetention account={account} />);
  await openConfirmation();
  await view.unmount();

  expect(discard).not.toHaveBeenCalled();
});

it('keeps a confirmation valid through an ordinary rerender of the same account', async () => {
  const view = await render(<ReferralDraftRetention account={account} />);
  await openConfirmation();
  await view.rerender(<ReferralDraftRetention account={{ ...account }} />);

  await fireEvent.press(screen.getByTestId('discard-modal-confirm'));

  expect(discard).toHaveBeenCalledExactlyOnceWith(account);
});
