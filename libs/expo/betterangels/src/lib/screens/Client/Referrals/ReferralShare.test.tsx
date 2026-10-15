import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react-native';
import { Alert } from 'react-native';
import { uiComponents } from '../../../../__mocks__/sharedBarrels';
import { ReferralShare } from './ReferralShare';
import type { ExportReferral } from './referralExport';
import { encodeReferralNotes } from './referralIntakeSidecar';
import { shareReferralText, shareReferralTextFile } from './shareReferralText';

vi.mock('@monorepo/expo/shared/ui-components', () => uiComponents());
vi.mock('./shareReferralText', () => ({
  shareReferralText: vi.fn(),
  shareReferralTextFile: vi.fn(),
}));
const referral: ExportReferral = {
  __typename: 'ReferralType',
  createdAt: '2026-09-08T12:00:00Z',
  id: 'r1',
  shelter: {
    __typename: 'ShelterType',
    id: 's1',
    name: 'Fictional Shelter',
    pets: [],
    demographics: [],
    accessibility: [],
  },
  notes: encodeReferralNotes('Staff observation', {
    substances: 'Sensitive answer',
    pets: ['CATS'],
  }),
};
const open = async () =>
  await fireEvent.press(screen.getByTestId('share-referral-r1'));
beforeEach(() => {
  vi.clearAllMocks();
});

it('previews before sharing, uses exactly the reviewed text, and resets private inclusion on reopening', async () => {
  await render(<ReferralShare referral={referral} clientName="Test Client" />);
  expect(shareReferralText).not.toHaveBeenCalled();
  await open();
  expect(screen.getByTestId('referral-share-preview')).not.toHaveTextContent(
    /Sensitive answer/,
  );
  await fireEvent.press(
    screen.getByRole('checkbox', {
      name: 'Include sensitive intake and staff notes',
    }),
  );
  expect(screen.getByTestId('referral-share-preview')).toHaveTextContent(
    /Sensitive answer/,
  );
  const text = screen.getByTestId('referral-share-preview').props.children;
  await fireEvent.press(screen.getByRole('button', { name: 'Share text' }));
  await waitFor(() =>
    expect(shareReferralText).toHaveBeenCalledExactlyOnceWith({
      title: 'Better Angels referral summary',
      text,
    }),
  );
  await fireEvent.press(screen.getByRole('button', { name: 'Close' }));
  await open();
  expect(screen.getByTestId('referral-share-preview')).not.toHaveTextContent(
    /Sensitive answer/,
  );
});

it('prevents duplicate handoffs and recovers after a failed share', async () => {
  const alert = vi.spyOn(Alert, 'alert').mockImplementation(vi.fn());
  let reject!: (error: Error) => void;
  vi.mocked(shareReferralText).mockReturnValueOnce(
    new Promise((_, fail) => {
      reject = fail;
    }),
  );
  await render(<ReferralShare referral={referral} clientName="Test Client" />);
  await open();
  const button = screen.getByRole('button', { name: 'Share text' });
  await fireEvent.press(button);
  await fireEvent.press(button);
  expect(shareReferralText).toHaveBeenCalledOnce();
  expect(button).toBeDisabled();
  await act(async () => {
    reject(new Error('Synthetic share failure'));
  });
  expect(alert).toHaveBeenCalledWith(
    'Could not open sharing',
    expect.any(String),
  );
  expect(button).not.toBeDisabled();
  alert.mockRestore();
});

it('revokes a delayed file handoff on close or unmount and permits reopening afterward', async () => {
  let finish!: () => void;
  vi.mocked(shareReferralTextFile).mockReturnValueOnce(
    new Promise((resolve) => {
      finish = resolve;
    }),
  );
  const view = await render(
    <ReferralShare referral={referral} clientName="Test Client" />,
  );
  await open();
  await fireEvent.press(
    screen.getByRole('button', { name: 'Share text file (.txt)' }),
  );
  const isCurrent = vi.mocked(shareReferralTextFile).mock.calls[0][1];
  expect(isCurrent()).toBe(true);
  await fireEvent.press(screen.getByRole('button', { name: 'Close' }));
  expect(isCurrent()).toBe(false);
  await act(async () => finish());
  await open();
  expect(screen.getByTestId('referral-share-preview')).toBeOnTheScreen();
  await view.unmount();
  expect(isCurrent()).toBe(false);
});

it('explains an unsupported saved format without offering a misleading export', async () => {
  const alert = vi.spyOn(Alert, 'alert').mockImplementation(vi.fn());
  await render(
    <ReferralShare
      referral={{ ...referral, notes: '<<<referral-intake:v9>>>' }}
      clientName="Test Client"
    />,
  );
  await open();
  expect(alert).toHaveBeenCalledWith(
    'Cannot prepare referral summary',
    expect.any(String),
  );
  expect(screen.queryByTestId('referral-share-preview')).toBeNull();
  expect(shareReferralTextFile).not.toHaveBeenCalled();
  alert.mockRestore();
});
