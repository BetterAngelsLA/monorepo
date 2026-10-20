import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { Alert } from 'react-native';
import { randomUUID } from 'node:crypto';
import { uiComponents } from '../../../../__mocks__/sharedBarrels';
import { createReferralDraftStore } from '../../../draft/referralDraft';
import { ReferralDraftProvider } from './ReferralDraftProvider';
import { DraftRecoveryNotice } from './DraftRecoveryNotice';
vi.mock('@monorepo/expo/shared/ui-components', () => uiComponents());

afterEach(() => vi.restoreAllMocks());
it('requires explicit confirmation before discarding unreadable data and handles deletion failure', async () => {
  const remove = vi.fn<() => void>(() => {
    throw new Error('disk unavailable');
  });
  const store = createReferralDraftStore(
    { load: () => 42, save: vi.fn(), remove },
    randomUUID,
  );
  const alert = vi.spyOn(Alert, 'alert');
  await render(
    <ReferralDraftProvider store={store}>
      <DraftRecoveryNotice />
    </ReferralDraftProvider>,
  );
  await fireEvent.press(screen.getByText('Discard unreadable draft'));
  expect(remove).not.toHaveBeenCalled();
  const confirm = alert.mock.calls[0][2]?.find(
    (button) => button.text === 'Discard',
  )?.onPress;
  await act(() => confirm?.());
  expect(
    screen.getByText('The draft could not be removed. Please try again.'),
  ).toBeOnTheScreen();
  expect(store.getRecoveryState()).toBe('unreadable');
  remove.mockImplementation(() => undefined);
  await act(() => confirm?.());
  expect(screen.queryByText('Local draft needs attention')).toBeNull();
  await act(() => expect(store.startNew('client')).toBe(true));
});
it('lets retry recover the original data without a discard confirmation', async () => {
  let unavailable = true;
  const store = createReferralDraftStore(
    {
      load: () => {
        if (unavailable) throw new Error('unavailable');
        return {
          clientId: 'client',
          step: 'intake',
          fields: { notes: 'Saved answer' },
          pii: {},
          selectedShelterId: null,
          updatedAt: 1,
        };
      },
      save: vi.fn(),
      remove: vi.fn(),
    },
    randomUUID,
  );
  await render(
    <ReferralDraftProvider store={store}>
      <DraftRecoveryNotice />
    </ReferralDraftProvider>,
  );
  unavailable = false;
  await fireEvent.press(screen.getByText('Retry reading draft'));
  expect(screen.queryByText('Local draft needs attention')).toBeNull();
  expect(store.getSnapshot()?.answers.notes).toBe('Saved answer');
});
