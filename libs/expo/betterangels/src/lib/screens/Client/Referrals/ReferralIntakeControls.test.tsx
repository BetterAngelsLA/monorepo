import '@testing-library/react-native/build/matchers/extend-expect';
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

function mountForm(store: ReferralDraftStore) {
  return render(
    <ReferralDraftProvider store={store}>
      <ReferralIntakeForm
        onCancel={vi.fn()}
        onPause={vi.fn()}
        onContinue={vi.fn()}
      />
    </ReferralDraftProvider>,
  );
}

function setup() {
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
  const view = mountForm(store);
  return {
    store,
    restart: () => {
      view.unmount();
      const reloaded = createReferralDraftStore(persistence);
      mountForm(reloaded);
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
  (key, label) => {
    const { store, restart } = setup();
    fireEvent.press(screen.getByTestId('selfcare-no-btn'));
    fireEvent.changeText(screen.getByLabelText(label), 'First observation');
    expect(store.getField(key)).toBe('First observation');
    fireEvent.changeText(screen.getByLabelText(label), 'Revised observation');
    expect(store.getField(key)).toBe('Revised observation');
    fireEvent.changeText(screen.getByLabelText(label), '');
    expect(store.getField(key)).toBe('');
    expect(store.getField('selfcare')).toBe('No');
    const reloaded = restart();
    expect(screen.getByLabelText(label)).toHaveDisplayValue('');
    expect(reloaded.getField(key)).toBe('');
    expect(reloaded.getField('selfcare')).toBe('No');
  },
);

it('starts self-care unanswered, switches between Yes and No, and restores No as an answer', () => {
  const { store, restart } = setup();
  const yes = () => screen.getByTestId('selfcare-yes-btn');
  const no = () => screen.getByTestId('selfcare-no-btn');
  expect(yes().props.accessibilityState.selected).toBe(false);
  expect(no().props.accessibilityState.selected).toBe(false);
  expect(store.getField('selfcare')).toBeUndefined();
  fireEvent.press(yes());
  expect(store.getField('selfcare')).toBe('Yes');
  expect(yes().props.accessibilityState.selected).toBe(true);
  fireEvent.press(no());
  expect(store.getField('selfcare')).toBe('No');
  expect(yes().props.accessibilityState.selected).toBe(false);
  expect(no().props.accessibilityState.selected).toBe(true);
  restart();
  expect(no().props.accessibilityState.selected).toBe(true);
  expect(yes().props.accessibilityState.selected).toBe(false);
});

it('records consent as a boolean and keeps an unchecked answer unchecked after restart', () => {
  const { store, restart } = setup();
  expect(consent()).not.toBeChecked();
  fireEvent.press(consent());
  expect(consent()).toBeChecked();
  expect(store.getField('consent')).toBe(true);
  fireEvent.press(consent());
  expect(consent()).not.toBeChecked();
  expect(store.getField('consent')).toBe(false);
  const reloaded = restart();
  expect(consent()).not.toBeChecked();
  expect(reloaded.getField('consent')).toBe(false);
});

it('restores text, multiline notes, consent, and choices together from a new store instance', () => {
  const { store, restart } = setup();
  fireEvent.changeText(
    screen.getByLabelText('Substances'),
    'Fictional sensitive answer',
  );
  fireEvent.changeText(
    screen.getByLabelText('Staff Observations / Notes'),
    'First line\nSecond line',
  );
  fireEvent.press(consent());
  fireEvent.press(screen.getByTestId('selfcare-yes-btn'));
  fireEvent.press(screen.getByTestId('pets-CATS-btn'));
  expect(store.getSnapshot()?.pii).toEqual({
    substances: 'Fictional sensitive answer',
  });
  const reloaded = restart();
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
