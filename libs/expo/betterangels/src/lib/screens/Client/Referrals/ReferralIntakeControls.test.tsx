import { fireEvent, render, screen } from '@testing-library/react-native';
import { icons, svg, uiComponents } from '../../../../__mocks__/sharedBarrels';
import { ReferralDraftProvider } from './ReferralDraftProvider';
import { ReferralIntakeForm } from './ReferralIntakeForm';
import {
  createReferralDraftStore,
  type ReferralDraftStore,
} from './referralDraft';

vi.mock('@monorepo/expo/shared/ui-components', () => uiComponents());
vi.mock('@monorepo/expo/shared/icons', () => icons());
vi.mock('react-native-svg', () => svg());

async function mountForm(store: ReferralDraftStore) {
  return await render(
    <ReferralDraftProvider store={store}>
      <ReferralIntakeForm
        onCancel={vi.fn()}
        onPause={vi.fn()}
        onContinue={vi.fn()}
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
  const store = createReferralDraftStore(persistence);
  store.startNew('client-1');
  const view = await mountForm(store);
  return {
    store,
    restart: async () => {
      await view.unmount();
      const reloaded = createReferralDraftStore(persistence);
      await mountForm(reloaded);
      return reloaded;
    },
  };
}

const consent = () =>
  screen.getByRole('checkbox', { name: /Client gave consent/ });

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

it('records consent as a boolean and keeps an unchecked answer unchecked after restart', async () => {
  const { store, restart } = await setup();
  expect(consent()).not.toBeChecked();
  await fireEvent.press(consent());
  expect(consent()).toBeChecked();
  expect(store.getField('consent')).toBe(true);
  await fireEvent.press(consent());
  expect(consent()).not.toBeChecked();
  expect(store.getField('consent')).toBe(false);
  const reloaded = await restart();
  expect(consent()).not.toBeChecked();
  expect(reloaded.getField('consent')).toBe(false);
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
  await fireEvent.press(consent());
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
  expect(consent()).toBeChecked();
  expect(
    screen.getByTestId('selfcare-yes-btn').props.accessibilityState.selected,
  ).toBe(true);
  expect(screen.getByTestId('pets-CATS-btn')).toBeChecked();
  expect(reloaded.getSnapshot()?.answers).toEqual({
    substances: 'Fictional sensitive answer',
    notes: 'First line\nSecond line',
    consent: true,
    selfcare: 'Yes',
    pets: ['CATS'],
  });
});
