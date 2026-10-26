import { randomUUID } from 'node:crypto';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { icons, svg, uiComponents } from '../../../../__mocks__/sharedBarrels';
import { ReferralDraftProvider } from './ReferralDraftProvider';
import { ReferralIntakeForm } from './ReferralIntakeForm';
import { INTAKE_FIELDS } from '../../../draft/intakeFields';
import { Colors } from '@monorepo/expo/shared/static';
import {
  createReferralDraftStore,
  type ReferralDraftStore,
} from '../../../draft/referralDraft';

vi.mock('@monorepo/expo/shared/ui-components', () => uiComponents());
vi.mock('@monorepo/expo/shared/icons', () => icons());
vi.mock('react-native-svg', () => svg());
vi.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 24, left: 0, right: 0 }),
}));
vi.mock('../../../hooks', () => ({
  useSnackbar: () => ({ showSnackbar: vi.fn() }),
}));

async function mountForm(store: ReferralDraftStore, onContinue = vi.fn()) {
  return await render(
    <ReferralDraftProvider store={store}>
      <ReferralIntakeForm
        onCancel={vi.fn()}
        onPause={vi.fn()}
        onContinue={onContinue}
      />
    </ReferralDraftProvider>,
  );
}

async function setup() {
  let saved: string | null = null;
  const persistence = {
    load: () => (saved === null ? null : JSON.parse(saved)),
    save: (draft: unknown) => {
      saved = JSON.stringify(draft);
    },
    remove: () => {
      saved = null;
    },
  };
  const store = createReferralDraftStore(persistence, randomUUID);
  store.startNew('client-1');
  const view = await mountForm(store);
  return {
    store,
    restart: async () => {
      await view.unmount();
      const reloaded = createReferralDraftStore(persistence, randomUUID);
      await mountForm(reloaded);
      return reloaded;
    },
  };
}

const consentYes = () => screen.getByTestId('consent-yes-btn');
const consentNo = () => screen.getByTestId('consent-no-btn');

it('uses the edit-specific confirmation and discards only the local unsaved changes', async () => {
  const savedNotes = 'Previously saved notes';
  const store = createReferralDraftStore(
    { load: () => null, save: vi.fn(), remove: vi.fn() },
    randomUUID,
  );
  store.startNew('client-1', {
    source: { kind: 'edit', referralId: 'saved-r1', originalNotes: savedNotes },
    values: { notes: savedNotes },
    selectedShelterId: 's1',
  });
  store.setField('notes', 'Unsaved edits');
  const draftId = store.getSnapshot()?.id;
  if (!draftId) throw new Error('Expected an edit draft');
  const onCancel = vi.fn(() => store.clear(draftId));
  const onContinue = vi.fn();
  await render(
    <ReferralDraftProvider store={store}>
      <ReferralIntakeForm
        editing
        onCancel={onCancel}
        onPause={vi.fn()}
        onContinue={onContinue}
      />
    </ReferralDraftProvider>,
  );
  await fireEvent.press(screen.getByTestId('intake-cancel-btn'));
  expect(screen.getByText('Discard unsaved changes?')).toBeOnTheScreen();
  expect(
    screen.getByText('The saved referral will remain unchanged.'),
  ).toBeOnTheScreen();
  expect(store.getField('notes')).toBe('Unsaved edits');
  expect(store.getSnapshot()?.source).toEqual({
    kind: 'edit',
    referralId: 'saved-r1',
    originalNotes: savedNotes,
  });
  expect(onCancel).not.toHaveBeenCalled();
  await fireEvent.press(screen.getByTestId('discard-modal-confirm'));
  expect(onCancel).toHaveBeenCalledOnce();
  expect(store.getSnapshot()).toBeNull();
  expect(onContinue).not.toHaveBeenCalled();
});

it('uses an accessible next chevron and warns about past arrival without blocking continuation', async () => {
  const { store } = await setup();
  const onContinue = vi.fn();
  // Setup mounted an empty form; mount the same store with the callback separately.
  await screen.unmount();
  await mountForm(store, onContinue);
  expect(
    screen.getByRole('button', { name: 'continue to shelter picker' }),
  ).toHaveStyle({ width: 48, minHeight: 48 });
  expect(screen.queryByText('Next')).toBeNull();
  await fireEvent.changeText(
    screen.getByLabelText('Requested arrival date'),
    '2000-01-01',
  );
  expect(
    screen.getByTestId('requested-arrival-past-warning'),
  ).toHaveTextContent('Past date. Saving is still allowed.');
  expect(screen.getByTestId('requested-arrival-past-warning').props.color).toBe(
    Colors.ERROR,
  );
  await fireEvent.press(screen.getByTestId('intake-next-btn'));
  expect(onContinue).toHaveBeenCalledOnce();
  await fireEvent.press(
    screen.getByRole('button', { name: 'Clear Requested arrival date' }),
  );
  expect(screen.queryByTestId('requested-arrival-past-warning')).toBeNull();
});

it('labels current intake fields as optional and permits continuing with them unanswered', async () => {
  const store = createReferralDraftStore(
    { load: () => null, save: vi.fn(), remove: vi.fn() },
    randomUUID,
  );
  store.startNew('client-1');
  const onContinue = vi.fn();
  await mountForm(store, onContinue);
  expect(screen.getByTestId('referral-intake-fields')).toBeOnTheScreen();
  expect(screen.getByTestId('referral-intake-screen')).toHaveStyle({
    paddingBottom: 24,
  });
  expect(screen.getByText('Referral information')).toBeOnTheScreen();
  expect(screen.queryByText('Required Information for Referral')).toBeNull();
  for (const field of INTAKE_FIELDS) {
    expect(
      screen.getByTestId(`intake-${field.key}-requirement`),
    ).toHaveTextContent(/^Optional/);
  }
  expect(screen.getByTestId('intake-storage-requirement')).toHaveTextContent(
    'Optional · requirement under review',
  );
  await fireEvent.press(screen.getByTestId('intake-next-btn'));
  expect(onContinue).toHaveBeenCalledOnce();
});

it.each([
  ['substances', 'Substances'],
  ['notes', 'Staff Observations / Notes'],
] as const)(
  'edits and clears %s through its text control without changing other answers',
  async (key, label) => {
    const { store, restart } = await setup();
    await fireEvent.press(screen.getByTestId('selfcare-no-btn'));
    await fireEvent.changeText(
      screen.getByLabelText(label),
      'First observation',
    );
    expect(store.getField(key)).toBe('First observation');
    await fireEvent.changeText(
      screen.getByLabelText(label),
      'Revised observation',
    );
    expect(store.getField(key)).toBe('Revised observation');
    await fireEvent.changeText(screen.getByLabelText(label), '');
    expect(store.getField(key)).toBe('');
    expect(store.getField('selfcare')).toBe('No');
    const reloaded = await restart();
    expect(screen.getByLabelText(label)).toHaveDisplayValue('');
    expect(reloaded.getField(key)).toBe('');
    expect(reloaded.getField('selfcare')).toBe('No');
  },
);

it('starts self-care unanswered, switches between Yes and No, and restores No as an answer', async () => {
  const { store, restart } = await setup();
  const yes = () => screen.getByTestId('selfcare-yes-btn');
  const no = () => screen.getByTestId('selfcare-no-btn');
  expect(yes().props.accessibilityState.selected).toBe(false);
  expect(no().props.accessibilityState.selected).toBe(false);
  expect(store.getField('selfcare')).toBeUndefined();
  await fireEvent.press(yes());
  expect(store.getField('selfcare')).toBe('Yes');
  expect(yes().props.accessibilityState.selected).toBe(true);
  await fireEvent.press(no());
  expect(store.getField('selfcare')).toBe('No');
  expect(yes().props.accessibilityState.selected).toBe(false);
  expect(no().props.accessibilityState.selected).toBe(true);
  await restart();
  expect(no().props.accessibilityState.selected).toBe(true);
  expect(yes().props.accessibilityState.selected).toBe(false);
});

it('records consent as a yes/no answer and restores a refusal after restart', async () => {
  const { store, restart } = await setup();
  expect(consentYes().props.accessibilityState.selected).toBe(false);
  expect(consentNo().props.accessibilityState.selected).toBe(false);
  expect(screen.getByLabelText('DHS data-sharing consent: Yes')).toBe(
    consentYes(),
  );
  await fireEvent.press(consentYes());
  expect(store.getField('consent')).toBe('Yes');
  await fireEvent.press(consentNo());
  expect(store.getField('consent')).toBe('No');
  expect(consentNo().props.accessibilityState.selected).toBe(true);
  const reloaded = await restart();
  expect(consentNo().props.accessibilityState.selected).toBe(true);
  expect(reloaded.getField('consent')).toBe('No');
});

it('restores text, multiline notes, consent, and choices together from a new store instance', async () => {
  const { store, restart } = await setup();
  await fireEvent.changeText(
    screen.getByLabelText('Substances'),
    'Fictional sensitive answer',
  );
  await fireEvent.changeText(
    screen.getByLabelText('Staff Observations / Notes'),
    'First line\nSecond line',
  );
  await fireEvent.press(consentYes());
  await fireEvent.press(screen.getByTestId('selfcare-yes-btn'));
  await fireEvent.press(screen.getByTestId('pets-CATS-btn'));
  expect(store.getSnapshot()?.pii).toEqual({
    substances: 'Fictional sensitive answer',
  });
  const reloaded = await restart();
  expect(screen.getByLabelText('Substances')).toHaveDisplayValue(
    'Fictional sensitive answer',
  );
  expect(
    screen.getByLabelText('Staff Observations / Notes'),
  ).toHaveDisplayValue('First line\nSecond line');
  expect(consentYes().props.accessibilityState.selected).toBe(true);
  expect(
    screen.getByTestId('selfcare-yes-btn').props.accessibilityState.selected,
  ).toBe(true);
  expect(screen.getByTestId('pets-CATS-btn')).toBeChecked();
  expect(reloaded.getSnapshot()?.answers).toEqual({
    substances: 'Fictional sensitive answer',
    notes: 'First line\nSecond line',
    consent: 'Yes',
    selfcare: 'Yes',
    pets: ['CATS'],
  });
});
