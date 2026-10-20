import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { Alert } from 'react-native';
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
it('explains retention and removes only the supplied account after confirmation', async () => {
  const account = { apiUrl: 'https://test-api', userId: 'user-1' };
  const alert = vi.spyOn(Alert, 'alert');
  await render(<ReferralDraftRetention account={account} />);
  expect(
    screen.getByText(/stay on this device after sign-out/),
  ).toBeOnTheScreen();
  await fireEvent.press(screen.getByText('Remove my local referral drafts'));
  expect(discard).not.toHaveBeenCalled();
  await act(() =>
    alert.mock.calls[0][2]
      ?.find((button) => button.text === 'Remove drafts')
      ?.onPress?.(),
  );
  expect(discard).toHaveBeenCalledWith(account);
  expect(
    screen.getByText('Your local referral drafts were removed.'),
  ).toBeOnTheScreen();
});
it('reports a failed removal without claiming success', async () => {
  discard.mockImplementation(() => {
    throw new Error('disk unavailable');
  });
  const alert = vi.spyOn(Alert, 'alert');
  await render(
    <ReferralDraftRetention
      account={{ apiUrl: 'https://test-api', userId: 'user-1' }}
    />,
  );
  await fireEvent.press(screen.getByText('Remove my local referral drafts'));
  await act(() =>
    alert.mock.calls[0][2]
      ?.find((button) => button.text === 'Remove drafts')
      ?.onPress?.(),
  );
  expect(
    screen.getByText('Some drafts could not be removed. Please try again.'),
  ).toBeOnTheScreen();
});

const originalAccount = { apiUrl: 'https://test-api', userId: 'user-1' };
it.each([
  { apiUrl: 'https://other-api', userId: 'user-1' },
  { apiUrl: 'https://test-api', userId: 'user-2' },
])(
  'ignores an old removal confirmation after the account context changes: %j',
  async (nextAccount) => {
    const alert = vi.spyOn(Alert, 'alert');
    const view = await render(
      <ReferralDraftRetention account={originalAccount} />,
    );
    await fireEvent.press(screen.getByText('Remove my local referral drafts'));
    const confirm = alert.mock.calls[0][2]?.find(
      (button) => button.text === 'Remove drafts',
    )?.onPress;
    await view.rerender(<ReferralDraftRetention account={nextAccount} />);
    await act(() => confirm?.());
    expect(discard).not.toHaveBeenCalled();
  },
);

it('does not revive an old confirmation when the original account returns', async () => {
  const alert = vi.spyOn(Alert, 'alert');
  const view = await render(
    <ReferralDraftRetention account={originalAccount} />,
  );
  await fireEvent.press(screen.getByText('Remove my local referral drafts'));
  const confirm = alert.mock.calls[0][2]?.find(
    (button) => button.text === 'Remove drafts',
  )?.onPress;
  await view.rerender(
    <ReferralDraftRetention
      account={{ ...originalAccount, userId: 'user-2' }}
    />,
  );
  await view.rerender(<ReferralDraftRetention account={originalAccount} />);
  await act(() => confirm?.());
  expect(discard).not.toHaveBeenCalled();
});

it('revokes an open confirmation when its screen unmounts', async () => {
  const alert = vi.spyOn(Alert, 'alert');
  const view = await render(
    <ReferralDraftRetention account={originalAccount} />,
  );
  await fireEvent.press(screen.getByText('Remove my local referral drafts'));
  const confirm = alert.mock.calls[0][2]?.find(
    (button) => button.text === 'Remove drafts',
  )?.onPress;
  await view.unmount();
  await act(() => confirm?.());
  expect(discard).not.toHaveBeenCalled();
});

it('keeps a confirmation valid through an ordinary rerender of the same account', async () => {
  const alert = vi.spyOn(Alert, 'alert');
  const view = await render(
    <ReferralDraftRetention account={originalAccount} />,
  );
  await fireEvent.press(screen.getByText('Remove my local referral drafts'));
  const confirm = alert.mock.calls[0][2]?.find(
    (button) => button.text === 'Remove drafts',
  )?.onPress;
  await view.rerender(
    <ReferralDraftRetention account={{ ...originalAccount }} />,
  );
  await act(() => confirm?.());
  expect(discard).toHaveBeenCalledExactlyOnceWith(originalAccount);
});
