/**
 * The intake form's multi-select controls.
 *
 * These replaced yes/no on every field that has a shelter-side counterpart. The
 * point is not the widget: it is that an answer is now recorded in the shelter's
 * own value set, so "cats" can actually be compared against a shelter's pet list.
 * `Pets: Yes` never could be.
 *
 * Test-plan reference: referral-test-brief.md, cases T1 and T3.
 */
import '@testing-library/react-native/build/matchers/extend-expect';
import { icons, svg, uiComponents } from '../../../../__mocks__/sharedBarrels';
import {
  act,
  fireEvent,
  render as renderNative,
  screen,
} from '@testing-library/react-native';
import { PetChoices } from '../../../apollo';
import { ReferralIntakeForm } from './ReferralIntakeForm';
import {
  createReferralDraftStore,
  type ReferralDraftStore,
} from './referralDraft';
import { ReferralDraftProvider } from './ReferralDraftProvider';

// See sharedBarrels.tsx: the shared barrels pull in native-backed components
// whose native halves don't exist under test. `static` stays real.
vi.mock('@monorepo/expo/shared/ui-components', () => uiComponents());
vi.mock('@monorepo/expo/shared/icons', () => icons());
vi.mock('react-native-svg', () => svg());
vi.mock('expo-web-browser', () => ({ openBrowserAsync: vi.fn() }));
const CLIENT_ID = 'c-1';

let referralDraft: ReferralDraftStore;
const createStore = (initial: unknown = null) =>
  createReferralDraftStore({
    load: () => initial,
    save: vi.fn(),
    remove: vi.fn(),
  });
beforeEach(() => {
  referralDraft = createStore();
});
function render(element: Parameters<typeof renderNative>[0]) {
  return renderNative(element, {
    wrapper: ({ children }) => (
      <ReferralDraftProvider store={referralDraft}>
        {children}
      </ReferralDraftProvider>
    ),
  });
}

function renderForm() {
  referralDraft.startNew(CLIENT_ID);
  return render(
    <ReferralIntakeForm
      onCancel={vi.fn()}
      onPause={vi.fn()}
      onContinue={vi.fn()}
      profile={{ firstName: 'Client', lastName: 'One' }}
    />,
  );
}

const chip = (field: string, value: string) =>
  screen.getByTestId(`${field}-${value}-btn`);
const isOn = (field: string, value: string) =>
  chip(field, value).props.accessibilityState?.checked === true;

afterEach(() => referralDraft.clear());

describe('multi-select intake fields', () => {
  it('offers one chip per value the shelter can hold', () => {
    renderForm();

    // All 7 pet values, not a yes/no pair.
    expect(screen.getByTestId(`pets-${PetChoices.Cats}-btn`)).toBeOnTheScreen();
    expect(screen.getByTestId('pets-SERVICE_ANIMALS-btn')).toBeOnTheScreen();
    expect(screen.getByTestId('pets-DOGS_UNDER_25_LBS-btn')).toBeOnTheScreen();
  });

  it('shows the human label rather than the stored value', () => {
    renderForm();

    expect(screen.getByText('Dogs (< 25 lbs)')).toBeOnTheScreen();
    expect(screen.queryByText('DOGS_UNDER_25_LBS')).toBeNull();
  });

  it('selects a value on first tap', () => {
    renderForm();
    expect(isOn('pets', 'CATS')).toBe(false);

    fireEvent.press(chip('pets', 'CATS'));

    expect(isOn('pets', 'CATS')).toBe(true);
  });

  it('deselects on a second tap', () => {
    renderForm();
    fireEvent.press(chip('pets', 'CATS'));

    fireEvent.press(chip('pets', 'CATS'));

    expect(isOn('pets', 'CATS')).toBe(false);
  });

  it('keeps both when two values are chosen — the whole reason for the change', () => {
    renderForm();

    fireEvent.press(chip('pets', 'CATS'));
    fireEvent.press(chip('pets', 'SERVICE_ANIMALS'));

    expect(isOn('pets', 'CATS')).toBe(true);
    expect(isOn('pets', 'SERVICE_ANIMALS')).toBe(true);
  });

  it('writes the selection through to the draft so Pause keeps it', () => {
    renderForm();

    fireEvent.press(chip('pets', 'CATS'));
    fireEvent.press(chip('accessibility', 'WHEELCHAIR_ACCESSIBLE'));

    expect(referralDraft.getField('pets')).toEqual(['CATS']);
    expect(referralDraft.getField('accessibility')).toEqual([
      'WHEELCHAIR_ACCESSIBLE',
    ]);
  });

  it('rehydrates a resumed draft with its chips already on', () => {
    referralDraft.startNew(CLIENT_ID);
    referralDraft.setField('pets', [PetChoices.Cats]);

    render(
      <ReferralIntakeForm
        onCancel={vi.fn()}
        onPause={vi.fn()}
        onContinue={vi.fn()}
      />,
    );

    expect(isOn('pets', 'CATS')).toBe(true);
    expect(isOn('pets', 'SERVICE_ANIMALS')).toBe(false);
  });

  it('converted the non-matching fields too, so nothing is still a bare boolean', () => {
    renderForm();

    expect(screen.getByTestId('storage-AMNESTY_LOCKERS-btn')).toBeOnTheScreen();
    expect(
      screen.getByTestId('transportation-AUTOMOBILE-btn'),
    ).toBeOnTheScreen();
    expect(
      screen.getByTestId('special-DOMESTIC_VIOLENCE-btn'),
    ).toBeOnTheScreen();
  });

  it('leaves self-care as yes/no, having no shelter counterpart to match', () => {
    renderForm();

    expect(screen.getByTestId('selfcare-yes-btn')).toBeOnTheScreen();
    expect(screen.getByTestId('selfcare-no-btn')).toBeOnTheScreen();
  });

  it('allows an older answer to be replaced without retired options blocking edits', () => {
    referralDraft = createStore({
      clientId: CLIENT_ID,
      step: 'intake',
      fields: { pets: ['RETIRED_VALUE', 'CATS'] },
      pii: {},
      selectedShelterId: null,
      updatedAt: 1,
    });
    render(
      <ReferralIntakeForm
        onCancel={vi.fn()}
        onPause={vi.fn()}
        onContinue={vi.fn()}
      />,
    );

    expect(isOn('pets', 'CATS')).toBe(true);
    // Merely opening the form must not rewrite the saved record.
    expect(referralDraft.getSnapshot()?.storedValues.pets).toEqual([
      'RETIRED_VALUE',
      'CATS',
    ]);
    fireEvent.press(chip('pets', 'SERVICE_ANIMALS'));
    expect(referralDraft.getSnapshot()?.storedValues.pets).toEqual([
      'CATS',
      'SERVICE_ANIMALS',
    ]);
  });

  it('reflects writes from another consumer and clears without keeping a stale local copy', () => {
    renderForm();
    act(() => {
      referralDraft.setField('pets', [PetChoices.Cats]);
    });
    expect(isOn('pets', 'CATS')).toBe(true);
    act(() => {
      referralDraft.clear();
    });
    expect(isOn('pets', 'CATS')).toBe(false);
  });

  it('keeps the existing empty-intake continuation policy for pending requirements', () => {
    referralDraft.startNew(CLIENT_ID);
    const onContinue = vi.fn();
    render(
      <ReferralIntakeForm
        onCancel={vi.fn()}
        onPause={vi.fn()}
        onContinue={onContinue}
      />,
    );
    fireEvent.press(screen.getByTestId('intake-next-btn'));
    expect(onContinue).toHaveBeenCalledOnce();
  });
});
