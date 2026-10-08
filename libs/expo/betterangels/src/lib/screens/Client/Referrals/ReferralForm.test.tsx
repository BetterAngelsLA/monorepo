/**
 * FE-08-pick — shelter selection in the picker.
 *
 * Covers the deselect behaviour specifically: the cards look like radios and
 * behave like radios when moving a choice, but a second tap on the *selected*
 * card clears it. Without that, a volunteer who taps the wrong shelter has no
 * route back to "nothing chosen" short of cancelling the whole referral.
 *
 * ReferralsSubmission.test.tsx covers submission outcomes through the actual
 * referral screen and create flow, including this picker.
 *
 * RVTM §7 Tier 2.
 */
import '@testing-library/react-native/build/matchers/extend-expect';
import { createTestApolloCache } from '../../../../__mocks__/apolloCache';
import { icons, svg, uiComponents } from '../../../../__mocks__/sharedBarrels';
import { MockedProvider } from '@apollo/client/testing/react';
import { useState } from 'react';
import {
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react-native';
import { SHELTERS_PAGE_SIZE } from './constants';
import { ReferralForm } from './ReferralForm';
import { SheltersDocument } from './__generated__/Shelters.generated';

// See sharedBarrels.tsx: the shared barrels pull in native-backed components
// whose native halves don't exist under test. `static` stays real.
vi.mock('@monorepo/expo/shared/ui-components', () => uiComponents());
vi.mock('@monorepo/expo/shared/icons', () => icons());
vi.mock('react-native-svg', () => svg());
vi.mock('expo-web-browser', () => ({ openBrowserAsync: vi.fn() }));

const shelter = (id: string, name: string) => ({
  __typename: 'ShelterType' as const,
  id,
  name,
  phone: null,
  location: {
    __typename: 'ShelterLocationType' as const,
    place: `${id} Main St`,
    latitude: 0,
    longitude: 0,
  },
  pets: [{ __typename: 'PetType' as const, name: 'CATS' }],
  demographics: [],
  accessibility: [],
});

const mocks = [
  {
    request: {
      query: SheltersDocument,
      variables: { pagination: { offset: 0, limit: SHELTERS_PAGE_SIZE } },
    },
    result: {
      data: {
        shelters: {
          __typename: 'ShelterTypeOffsetPaginated',
          totalCount: 2,
          results: [
            shelter('s-1', 'Alpha House'),
            shelter('s-2', 'Beta House'),
          ],
        },
      },
    },
  },
];

function renderPicker(props: Partial<Parameters<typeof ReferralForm>[0]> = {}) {
  const onSelectShelter = vi.fn();
  function ControlledPicker() {
    const [selectedShelterId, setSelectedShelterId] = useState(
      props.selectedShelterId ?? null,
    );
    return (
      <ReferralForm
        onCancel={vi.fn()}
        onBack={vi.fn()}
        onSubmit={vi.fn().mockResolvedValue(true)}
        {...props}
        selectedShelterId={selectedShelterId}
        onSelectShelter={(id) => {
          setSelectedShelterId(id);
          onSelectShelter(id);
        }}
      />
    );
  }
  render(
    <MockedProvider cache={createTestApolloCache()} mocks={mocks}>
      <ControlledPicker />
    </MockedProvider>,
  );
  return { onSelectShelter };
}

const radios = () => screen.getAllByTestId('shelter-option-radio');
const isSelected = (i: number) =>
  screen.getAllByRole('radio')[i].props.accessibilityState?.selected === true;

describe('ReferralForm shelter selection', () => {
  it('lists the approved shelters returned by the query', async () => {
    renderPicker();

    expect(await screen.findByText('Alpha House')).toBeOnTheScreen();
    expect(screen.getByText('Beta House')).toBeOnTheScreen();
  });

  it('selects a shelter on first tap', async () => {
    const { onSelectShelter } = renderPicker();
    await screen.findByText('Alpha House');

    fireEvent.press(radios()[0]);

    await waitFor(() => expect(isSelected(0)).toBe(true));
    expect(onSelectShelter).toHaveBeenLastCalledWith('s-1');
  });

  it('clears the selection when the selected shelter is tapped again', async () => {
    const { onSelectShelter } = renderPicker();
    await screen.findByText('Alpha House');

    fireEvent.press(radios()[0]);
    await waitFor(() => expect(isSelected(0)).toBe(true));

    fireEvent.press(radios()[0]);

    await waitFor(() => expect(isSelected(0)).toBe(false));
    // null, not undefined — the draft must record "cleared", not "untouched"
    expect(onSelectShelter).toHaveBeenLastCalledWith(null);
  });

  it('moves the selection when a different shelter is tapped', async () => {
    const { onSelectShelter } = renderPicker();
    await screen.findByText('Alpha House');

    fireEvent.press(radios()[0]);
    await waitFor(() => expect(isSelected(0)).toBe(true));

    fireEvent.press(radios()[1]);

    await waitFor(() => expect(isSelected(1)).toBe(true));
    expect(isSelected(0)).toBe(false);
    expect(onSelectShelter).toHaveBeenLastCalledWith('s-2');
  });

  it('disables Submit until a shelter is chosen, and again once cleared', async () => {
    renderPicker();
    await screen.findByText('Alpha House');
    const submit = () => screen.getByTestId('submit-referral-btn');

    expect(submit().props.accessibilityState?.disabled).toBe(true);

    fireEvent.press(radios()[0]);
    await waitFor(() =>
      expect(submit().props.accessibilityState?.disabled).toBe(false),
    );

    fireEvent.press(radios()[0]);
    await waitFor(() =>
      expect(submit().props.accessibilityState?.disabled).toBe(true),
    );
  });

  it('seeds the selection from a resumed draft', async () => {
    renderPicker({ selectedShelterId: 's-2' });
    await screen.findByText('Beta House');

    expect(isSelected(1)).toBe(true);
    expect(screen.getByText('✓ Selected: Beta House')).toBeOnTheScreen();
  });

  it('offers Back to the intake step without cancelling or submitting', async () => {
    const onBack = vi.fn();
    const onCancel = vi.fn();
    const onSubmit = vi.fn().mockResolvedValue(true);
    renderPicker({ onBack, onCancel, onSubmit });
    await screen.findByText('Alpha House');

    fireEvent.press(screen.getByTestId('picker-back-btn'));

    expect(onBack).toHaveBeenCalledOnce();
    // Back is not an exit: nothing is discarded and no referral is sent.
    expect(onCancel).not.toHaveBeenCalled();
    expect(onSubmit).not.toHaveBeenCalled();
  });
});
