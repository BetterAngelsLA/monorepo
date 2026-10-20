import { PetChoices } from '@monorepo/ba-platform/types';
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
import { icons, svg, uiComponents } from '../../../../__mocks__/sharedBarrels';
import { MockedProvider } from '@apollo/client/testing/react';
import { InMemoryCache } from '@apollo/client';
import type { MockedResponse } from '@apollo/client/testing';
import { getUserLocation } from '@monorepo/expo/shared/ui-components';
import { useState } from 'react';
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react-native';
import { ReferralForm } from './ReferralForm';
import {
  SheltersDocument,
  type SheltersQuery,
} from './__generated__/Shelters.generated';

// See sharedBarrels.tsx: the shared barrels pull in native-backed components
// whose native halves don't exist under test. `static` stays real.
vi.mock('@monorepo/expo/shared/ui-components', () => uiComponents());
vi.mock('@monorepo/expo/shared/icons', () => icons());
vi.mock('react-native-svg', () => svg());
vi.mock('expo-web-browser', () => ({ openBrowserAsync: vi.fn() }));

const shelter = (
  id: string,
  name: string,
): SheltersQuery['shelters']['results'][number] => ({
  __typename: 'ShelterType' as const,
  id,
  name,
  location: {
    __typename: 'ShelterLocationType' as const,
    place: `${id} Main St`,
    latitude: 0,
    longitude: id === 's-1' ? 0.2 : 0.01,
  },
  pets: [{ __typename: 'PetType' as const, name: PetChoices.Cats }],
  demographics: [],
  accessibility: [],
});

const mocks = [
  {
    request: {
      query: SheltersDocument,
      variables: { pagination: { offset: 0, limit: 100 } },
    },
    result: {
      data: {
        __typename: 'Query' as const,
        shelters: {
          __typename: 'ShelterTypeOffsetPaginated' as const,
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

async function renderPicker(
  props: Partial<Parameters<typeof ReferralForm>[0]> = {},
  queryMocks: MockedResponse<SheltersQuery>[] = mocks,
  cache = new InMemoryCache(),
) {
  const onSelectShelter = vi.fn();
  function ControlledPicker() {
    const [selectedShelterId, setSelectedShelterId] = useState(
      props.selectedShelterId ?? null,
    );
    return (
      <ReferralForm
        onBack={vi.fn()}
        onCancel={vi.fn()}
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
  await render(
    <MockedProvider mocks={queryMocks} cache={cache}>
      <ControlledPicker />
    </MockedProvider>,
  );
  return { onSelectShelter };
}

const radios = () => screen.getAllByRole('radio');
const isSelected = (i: number) =>
  screen.getAllByRole('radio')[i].props.accessibilityState?.selected === true;

beforeEach(() => {
  vi.mocked(getUserLocation).mockReset();
});

describe('ReferralForm shelter selection', () => {
  it('keeps four header actions compact, named, and independently usable without wrapping their labels', async () => {
    const onBack = vi.fn();
    const onPause = vi.fn();
    await renderPicker({ onBack, onPause });
    await screen.findByText('Alpha House');
    const back = screen.getByRole('button', {
      name: 'back to referral information',
    });
    expect(back).toHaveStyle({ width: 48, minHeight: 48 });
    expect(screen.queryByText('Back')).toBeNull();
    expect(screen.getByText('Cancel').props.numberOfLines).toBe(1);
    expect(screen.getByText('Save').props.numberOfLines).toBe(1);
    expect(screen.getByTestId('picker-cancel-btn')).toHaveStyle({
      flexGrow: 1,
      flexShrink: 0,
      minHeight: 48,
    });
    await fireEvent.press(back);
    await fireEvent.press(screen.getByTestId('picker-pause-btn'));
    expect(onBack).toHaveBeenCalledOnce();
    expect(onPause).toHaveBeenCalledOnce();
  });
  it('exposes distinct radios and directory links without grouping away the child controls', async () => {
    await renderPicker();
    await screen.findByText('Alpha House');
    expect(screen.getByTestId('shelter-choice-group').props).toMatchObject({
      accessibilityRole: 'radiogroup',
      accessibilityLabel: 'Shelter choices',
      accessible: false,
    });
    expect(screen.getByTestId('shelter-option-row-s-1').props.accessible).toBe(
      false,
    );
    expect(screen.getByTestId('shelter-option-row-s-2')).toBeOnTheScreen();
    const first = screen.getByRole('radio', { name: 'Alpha House' });
    expect(first.props.testID).toBe('shelter-option-radio-s-1');
    expect(screen.getByRole('radio', { name: 'Beta House' }).props.testID).toBe(
      'shelter-option-radio-s-2',
    );
    expect(screen.getAllByRole('link')).toHaveLength(2);
    expect(first).not.toBeChecked();
    await fireEvent.press(first);
    expect(screen.getByRole('radio', { name: 'Alpha House' })).toBeChecked();
    expect(screen.getByRole('radio', { name: 'Beta House' })).not.toBeChecked();
  });
  it('lists the approved shelters returned by the query', async () => {
    await renderPicker();

    expect(await screen.findByText('Alpha House')).toBeOnTheScreen();
    expect(screen.getByText('Beta House')).toBeOnTheScreen();
  });

  it('selects a shelter on first tap', async () => {
    const { onSelectShelter } = await renderPicker();
    await screen.findByText('Alpha House');

    await fireEvent.press(radios()[0]);

    await waitFor(() => expect(isSelected(0)).toBe(true));
    expect(onSelectShelter).toHaveBeenLastCalledWith('s-1');
  });

  it('clears the selection when the selected shelter is tapped again', async () => {
    const { onSelectShelter } = await renderPicker();
    await screen.findByText('Alpha House');

    await fireEvent.press(radios()[0]);
    await waitFor(() => expect(isSelected(0)).toBe(true));

    await fireEvent.press(radios()[0]);

    await waitFor(() => expect(isSelected(0)).toBe(false));
    // null, not undefined — the draft must record "cleared", not "untouched"
    expect(onSelectShelter).toHaveBeenLastCalledWith(null);
  });

  it('moves the selection when a different shelter is tapped', async () => {
    const { onSelectShelter } = await renderPicker();
    await screen.findByText('Alpha House');

    await fireEvent.press(radios()[0]);
    await waitFor(() => expect(isSelected(0)).toBe(true));

    await fireEvent.press(radios()[1]);

    await waitFor(() => expect(isSelected(1)).toBe(true));
    expect(isSelected(0)).toBe(false);
    expect(onSelectShelter).toHaveBeenLastCalledWith('s-2');
  });

  it('disables Submit until a shelter is chosen, and again once cleared', async () => {
    await renderPicker();
    await screen.findByText('Alpha House');
    const submit = () => screen.getByTestId('submit-referral-btn');

    expect(submit().props.accessibilityState?.disabled).toBe(true);

    await fireEvent.press(radios()[0]);
    await waitFor(() =>
      expect(submit().props.accessibilityState?.disabled).toBe(false),
    );

    await fireEvent.press(radios()[0]);
    await waitFor(() =>
      expect(submit().props.accessibilityState?.disabled).toBe(true),
    );
  });

  it('seeds the selection from a resumed draft', async () => {
    await renderPicker({ selectedShelterId: 's-2' });
    await screen.findByText('Beta House');

    expect(isSelected(1)).toBe(true);
    expect(screen.getByText('✓ Selected: Beta House')).toBeOnTheScreen();
  });
});

describe('ReferralForm saved-selection verification', () => {
  it('rechecks a cached selection and blocks submission while loading or when absent from the fresh list', async () => {
    const cache = new InMemoryCache();
    cache.writeQuery({ query: SheltersDocument, data: mocks[0].result.data });
    const onSubmit = vi.fn();
    const { onSelectShelter } = await renderPicker(
      { selectedShelterId: 's-2', onSubmit },
      [
        {
          request: {
            query: SheltersDocument,
            variables: { pagination: { offset: 0, limit: 100 } },
          },
          delay: 0,
          result: {
            data: {
              __typename: 'Query' as const,
              shelters: {
                __typename: 'ShelterTypeOffsetPaginated' as const,
                totalCount: 1,
                results: [shelter('s-1', 'Alpha House')],
              },
            },
          },
        },
      ],
      cache,
    );
    expect(screen.getByTestId('submit-referral-btn')).toBeDisabled();
    await fireEvent.press(screen.getByTestId('submit-referral-btn'));
    expect(
      await screen.findByText(/^Your saved shelter selection/),
    ).toBeOnTheScreen();
    expect(screen.getByTestId('submit-referral-btn')).toBeDisabled();
    await fireEvent.press(screen.getByTestId('submit-referral-btn'));
    expect(onSubmit).not.toHaveBeenCalled();
    expect(onSelectShelter).not.toHaveBeenCalled();
    expect(screen.queryByText('✓ Selected: Beta House')).toBeNull();

    await fireEvent.press(radios()[0]);
    expect(screen.queryByText(/^Your saved shelter selection/)).toBeNull();
    await fireEvent.press(screen.getByTestId('submit-referral-btn'));
    expect(onSubmit).toHaveBeenCalledExactlyOnceWith('s-1', undefined);
  });

  it('retains the saved selection on failure and enables it only after a successful retry', async () => {
    const onSubmit = vi.fn();
    const { onSelectShelter } = await renderPicker(
      { selectedShelterId: 's-2', onSubmit },
      [
        {
          request: {
            query: SheltersDocument,
            variables: { pagination: { offset: 0, limit: 100 } },
          },
          error: new Error('Offline'),
          delay: 70,
          maxUsageCount: 2,
        },
        { ...mocks[0], delay: 70 },
      ],
    );
    for (let attempt = 0; attempt < 2; attempt++) {
      await screen.findByTestId('retry-shelters-btn');
      expect(screen.getByTestId('submit-referral-btn')).toBeDisabled();
      expect(screen.queryByText(/^Your saved shelter selection/)).toBeNull();
      await fireEvent.press(screen.getByTestId('submit-referral-btn'));
      expect(onSubmit).not.toHaveBeenCalled();
      await fireEvent.press(screen.getByTestId('retry-shelters-btn'));
      expect(screen.getByTestId('submit-referral-btn')).toBeDisabled();
      if (attempt === 0) {
        await waitFor(() =>
          expect(screen.getByTestId('retry-shelters-btn')).toBeEnabled(),
        );
      }
    }
    expect(await screen.findByText('✓ Selected: Beta House')).toBeOnTheScreen();
    expect(onSelectShelter).not.toHaveBeenCalled();
    await fireEvent.press(screen.getByTestId('submit-referral-btn'));
    expect(onSubmit).toHaveBeenCalledExactlyOnceWith('s-2', undefined);
  });

  it('keeps a saved ID blocked when the fresh list is empty', async () => {
    const onSubmit = vi.fn();
    await renderPicker({ selectedShelterId: 's-1', onSubmit }, [
      {
        request: {
          query: SheltersDocument,
          variables: { pagination: { offset: 0, limit: 100 } },
        },
        delay: 0,
        result: {
          data: {
            __typename: 'Query' as const,
            shelters: {
              __typename: 'ShelterTypeOffsetPaginated' as const,
              totalCount: 0,
              results: [],
            },
          },
        },
      },
    ]);
    await screen.findByText('No shelters available');
    expect(screen.getByText(/^Your saved shelter selection/)).toBeOnTheScreen();
    expect(screen.getByTestId('submit-referral-btn')).toBeDisabled();
    await fireEvent.press(screen.getByTestId('submit-referral-btn'));
    expect(onSubmit).not.toHaveBeenCalled();
  });
});

describe('ReferralForm opt-in distance', () => {
  const position = {
    location: {
      timestamp: 1,
      coords: {
        latitude: 0,
        longitude: 0,
        altitude: null,
        accuracy: 5,
        altitudeAccuracy: null,
        heading: null,
        speed: null,
      },
    },
  };
  const firstShelter = () =>
    within(screen.getAllByTestId(/^shelter-option-row-/)[0]).getByText(
      /^(Alpha|Beta) House$/,
    ).props.children;

  it('requests location only when selected and uses it to break matching ties', async () => {
    vi.mocked(getUserLocation).mockResolvedValue(position);
    await renderPicker();
    await screen.findByText('Alpha House');
    expect(getUserLocation).not.toHaveBeenCalled();
    expect(firstShelter()).toContain('Alpha House');
    await fireEvent.press(screen.getByText('Near me'));
    await waitFor(() => expect(firstShelter()).toContain('Beta House'));
    await fireEvent.press(screen.getByText('None'));
    expect(firstShelter()).toContain('Alpha House');
    await fireEvent.press(screen.getByText('Near me'));
    expect(firstShelter()).toContain('Beta House');
    expect(getUserLocation).toHaveBeenCalledOnce();
  });

  it.each([
    [
      null,
      'Could not get your location. Shelters stay in their current order.',
    ],
    [
      { requireSettingsUpdate: true as const },
      'Location is off for this app. Enable it in Settings to sort by distance.',
    ],
  ])(
    'keeps the order and explains an unavailable location: %j',
    async (result, message) => {
      vi.mocked(getUserLocation).mockResolvedValue(result);
      await renderPicker();
      await screen.findByText('Alpha House');
      await fireEvent.press(screen.getByText('Near me'));
      expect(await screen.findByText(message)).toBeOnTheScreen();
      expect(firstShelter()).toContain('Alpha House');
    },
  );

  it('handles a rejected location request without blocking referral selection', async () => {
    vi.mocked(getUserLocation).mockRejectedValue(new Error('GPS unavailable'));
    await renderPicker();
    await screen.findByText('Alpha House');
    await fireEvent.press(screen.getByText('Near me'));
    await screen.findByText(
      'Could not get your location. Shelters stay in their current order.',
    );
    await fireEvent.press(radios()[0]);
    expect(isSelected(0)).toBe(true);
  });

  it('ignores a late position after the user switches distance off', async () => {
    let resolvePosition: (value: typeof position) => void = () => {
      throw new Error('Location request has not started');
    };
    vi.mocked(getUserLocation).mockImplementation(
      () =>
        new Promise((resolve) => {
          resolvePosition = resolve;
        }),
    );
    await renderPicker();
    await screen.findByText('Alpha House');
    await fireEvent.press(screen.getByText('Near me'));
    expect(screen.getByText('Getting your location…')).toBeOnTheScreen();
    await fireEvent.press(screen.getByText('None'));
    await act(async () => resolvePosition(position));
    expect(firstShelter()).toContain('Alpha House');
    expect(screen.queryByText('Getting your location…')).toBeNull();
  });
});

// These component fixtures use production-shaped IDs and the corresponding directory.
vi.mock('@monorepo/ba-platform', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@monorepo/ba-platform')>()),
  useApiConfig: () => ({ apiUrl: 'https://api.prod.betterangels.la' }),
}));

it('finds and ranks a saved shelter on a later page before enabling Submit', async () => {
  const firstPage = Array.from({ length: 100 }, (_, i) => ({
    ...shelter(`first-${i}`, `First ${i}`),
    pets: [],
  }));
  const last = shelter('last', 'Zebra House');
  const onSubmit = vi.fn().mockResolvedValue(true);
  await renderPicker(
    {
      selectedShelterId: 'last',
      desiredAttributes: ['Cats'],
      onSubmit,
    },
    [
      {
        request: {
          query: SheltersDocument,
          variables: { pagination: { offset: 0, limit: 100 } },
        },
        result: {
          data: {
            __typename: 'Query',
            shelters: {
              __typename: 'ShelterTypeOffsetPaginated',
              totalCount: 101,
              results: firstPage,
            },
          },
        },
      },
      {
        request: {
          query: SheltersDocument,
          variables: { pagination: { offset: 100, limit: 100 } },
        },
        delay: 70,
        result: {
          data: {
            __typename: 'Query',
            shelters: {
              __typename: 'ShelterTypeOffsetPaginated',
              totalCount: 101,
              results: [last],
            },
          },
        },
      },
    ],
  );
  expect(screen.getByTestId('submit-referral-btn')).toBeDisabled();
  expect(screen.queryByText(/saved shelter selection is not/)).toBeNull();
  await waitFor(() =>
    expect(screen.getByTestId('submit-referral-btn')).toBeEnabled(),
  );
  expect(screen.getByText('✓ Selected: Zebra House')).toBeOnTheScreen();
  await fireEvent.press(screen.getByTestId('submit-referral-btn'));
  expect(onSubmit).toHaveBeenCalledWith('last', undefined);
  expect(screen.getAllByTestId(/^shelter-option-row-/)).toHaveLength(101);
  expect(screen.getAllByRole('radio')[0].props.accessibilityLabel).toBe(
    'Zebra House',
  );
});

it('blocks a partially loaded directory and retries all pages without losing the choice', async () => {
  const first = {
    request: {
      query: SheltersDocument,
      variables: { pagination: { offset: 0, limit: 100 } },
    },
    result: {
      data: {
        __typename: 'Query' as const,
        shelters: {
          __typename: 'ShelterTypeOffsetPaginated' as const,
          totalCount: 2,
          results: [shelter('s-1', 'Alpha House')],
        },
      },
    },
  };
  await renderPicker({ selectedShelterId: 's-1' }, [
    first,
    {
      request: {
        query: SheltersDocument,
        variables: { pagination: { offset: 1, limit: 100 } },
      },
      error: new Error('offline'),
    },
    first,
    {
      request: {
        query: SheltersDocument,
        variables: { pagination: { offset: 1, limit: 100 } },
      },
      result: {
        data: {
          __typename: 'Query',
          shelters: {
            __typename: 'ShelterTypeOffsetPaginated',
            totalCount: 2,
            results: [shelter('s-2', 'Beta House')],
          },
        },
      },
    },
  ]);
  await screen.findByTestId('retry-shelters-btn');
  expect(screen.getByTestId('submit-referral-btn')).toBeDisabled();
  expect(screen.queryByText(/saved shelter selection is not/)).toBeNull();
  await fireEvent.press(screen.getByTestId('retry-shelters-btn'));
  await waitFor(() =>
    expect(screen.getByTestId('submit-referral-btn')).toBeEnabled(),
  );
  expect(screen.getByText('✓ Selected: Alpha House')).toBeOnTheScreen();
});
