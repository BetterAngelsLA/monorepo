import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react-native';
import { Alert, View } from 'react-native';
import { AdaAccommodationEnum } from '../../../apollo';
import { uiComponents } from '../../../../__mocks__/sharedBarrels';
import { ReferralShare } from './ReferralShare';
import type { ExportReferral } from './referralExport';
import { encodeReferralNotes } from './referralIntakeSidecar';
import {
  shareReferralPng,
  shareReferralText,
  shareReferralTextFile,
} from './shareReferralText';
import type { ReferralImageLayout } from './referralImage';

vi.mock('@monorepo/expo/shared/ui-components', () => uiComponents());
vi.mock('./shareReferralText', () => ({
  shareReferralText: vi.fn(),
  shareReferralTextFile: vi.fn(),
  shareReferralPng: vi.fn(),
}));
vi.mock('./ReferralImagePreview', () => ({
  ReferralImagePreview: ({
    layout,
    onReady,
  }: {
    layout: ReferralImageLayout;
    onReady: (capture: () => Promise<string>) => void;
  }) => (
    <View
      testID="mock-image-preview"
      onLayout={() => onReady(async () => JSON.stringify(layout))}
    />
  ),
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

it('includes profile accommodations in the reviewed copy and file only while the sensitive option is checked', async () => {
  await render(
    <ReferralShare
      referral={referral}
      clientName="Test Client"
      profile={{
        age: 0,
        displayGender: 'Woman',
        adaAccommodation: [AdaAccommodationEnum.Mobility],
      }}
    />,
  );
  await open();
  const toggle = screen.getByTestId('referral-share-include-private');
  const file = screen.getByRole('button', { name: 'Share text file (.txt)' });
  for (const [index, included] of [false, true, false].entries()) {
    if (index > 0) await fireEvent.press(toggle);
    expect(toggle.props.accessibilityState.checked).toBe(included);
    const text = screen.getByTestId('referral-share-preview').props.children;
    expect(text).toContain('Age: 0');
    expect(text).toContain('Gender: Woman');
    if (included) {
      expect(text).toContain('Accommodations [Sensitive]: Mobility');
      expect(text).toContain('Sensitive answer');
      expect(text).toContain('Staff observation');
      expect(
        screen.getByTestId('referral-share-privacy-status'),
      ).toHaveTextContent('Sensitive details included where recorded.');
    } else {
      expect(text).toContain(
        'Accommodations [Sensitive]: Excluded (sensitive)',
      );
      expect(text).not.toContain('Sensitive answer');
      expect(text).not.toContain('Staff observation');
    }
    await fireEvent.press(file);
    await waitFor(() =>
      expect(shareReferralTextFile).toHaveBeenCalledTimes(index + 1),
    );
    expect(vi.mocked(shareReferralTextFile).mock.calls[index][0].text).toBe(
      text,
    );
  }
});

it('makes the privacy mode visible even when a sparse record has no saved private answers', async () => {
  await render(
    <ReferralShare
      referral={{ ...referral, notes: null }}
      clientName="Sparse Client"
    />,
  );
  await open();
  expect(screen.getByTestId('referral-share-preview')).toHaveTextContent(
    /Substances \[Sensitive\]: Excluded \(sensitive\)/,
  );
  await fireEvent.press(screen.getByTestId('referral-share-include-private'));
  expect(screen.getByTestId('referral-share-preview')).toHaveTextContent(
    /Substances \[Sensitive\]: Not recorded/,
  );
  expect(screen.getByTestId('referral-share-preview')).toHaveTextContent(
    /Staff Observations \/ Notes \[Sensitive\]: Not recorded/,
  );
});

it('previews an image and binds capture to the exact privacy-reviewed copy, retaining text sharing', async () => {
  await render(<ReferralShare referral={referral} clientName="Ana Muñoz" />);
  await open();
  await fireEvent.press(screen.getByTestId('referral-image-mode'));
  for (const [index, included] of [false, true, false].entries()) {
    if (index > 0)
      await fireEvent.press(
        screen.getByTestId('referral-share-include-private'),
      );
    expect(screen.getByTestId('referral-share-png')).toBeDisabled();
    await fireEvent(screen.getByTestId('mock-image-preview'), 'layout');
    expect(screen.getByTestId('referral-share-png')).not.toBeDisabled();
    await fireEvent.press(screen.getByTestId('referral-share-png'));
    await waitFor(() =>
      expect(shareReferralPng).toHaveBeenCalledTimes(index + 1),
    );
    const [capture, isCurrent] = vi.mocked(shareReferralPng).mock.calls[index];
    expect(isCurrent()).toBe(true);
    const captured: ReferralImageLayout = JSON.parse(await capture());
    const words = captured.lines.map((line) => line.text).join('');
    expect(words.includes('Sensitive answer')).toBe(included);
    expect(words.includes('Staff observation')).toBe(included);
    expect(
      captured.lines.some(
        (line) => line.text === 'Name:' && line.fontWeight === '700',
      ),
    ).toBe(true);
  }
  await fireEvent.press(screen.getByTestId('referral-image-mode'));
  expect(screen.getByRole('button', { name: 'Share text' })).toBeOnTheScreen();
  expect(
    screen.getByRole('button', { name: 'Share text file (.txt)' }),
  ).toBeOnTheScreen();
  await fireEvent.press(screen.getByTestId('referral-share-close'));
  expect(
    vi
      .mocked(shareReferralPng)
      .mock.calls.every(([, isCurrent]) => !isCurrent()),
  ).toBe(true);
});

it('offers the complete text copy instead of truncating a summary too large for PNG', async () => {
  await render(
    <ReferralShare
      referral={{ ...referral, notes: 'W'.repeat(20001) }}
      clientName="Test Client"
    />,
  );
  await open();
  await fireEvent.press(screen.getByTestId('referral-share-include-private'));
  await fireEvent.press(screen.getByTestId('referral-image-mode'));
  expect(screen.getByTestId('referral-image-error')).toHaveTextContent(
    /too large/,
  );
  expect(screen.getByTestId('referral-share-png')).toBeDisabled();
  await fireEvent.press(screen.getByTestId('referral-image-mode'));
  expect(screen.getByTestId('referral-share-preview').props.children).toContain(
    'W'.repeat(20001),
  );
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
      name: 'Include sensitive information and staff notes',
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
