import { randomUUID } from 'node:crypto';
import { MockedProvider } from '@apollo/client/testing/react';
import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { Text } from 'react-native';
import { icons, svg, uiComponents } from '../../../../__mocks__/sharedBarrels';
import { PetChoices } from '../../../apollo';
import { ReferralCreateFlow } from './ReferralCreateFlow';
import {
  ReferralDraftProvider,
  useReferralDraft,
} from './ReferralDraftProvider';
import { createReferralDraftStore } from './referralDraft';
import { SheltersDocument } from './__generated__/Shelters.generated';

vi.mock('@monorepo/expo/shared/ui-components', () => uiComponents());
vi.mock('@monorepo/expo/shared/icons', () => icons());
vi.mock('react-native-svg', () => svg());
vi.mock('../../../hooks', () => ({
  useSnackbar: () => ({ showSnackbar: vi.fn() }),
}));
vi.mock('expo-web-browser', () => ({ openBrowserAsync: vi.fn() }));

const createStore = () =>
  createReferralDraftStore(
    {
      load: () => null,
      save: vi.fn(),
      remove: vi.fn(),
    },
    randomUUID,
  );

function Probe({ name }: { name: string }) {
  const { draft } = useReferralDraft();
  return <Text testID={name}>{draft?.answers.notes ?? 'No notes'}</Text>;
}

it('updates all subscribers to one store while keeping another provider independent', async () => {
  const first = createStore();
  const second = createStore();
  first.startNew('client-a');
  second.startNew('client-b');
  await render(
    <>
      <ReferralDraftProvider store={first}>
        <Probe name="first" />
        <Probe name="second" />
      </ReferralDraftProvider>
      <ReferralDraftProvider store={second}>
        <Probe name="isolated" />
      </ReferralDraftProvider>
    </>,
  );
  await act(() => {
    first.setField('notes', 'Shared update');
  });
  expect(screen.getByTestId('first')).toHaveTextContent('Shared update');
  expect(screen.getByTestId('second')).toHaveTextContent('Shared update');
  expect(screen.getByTestId('isolated')).toHaveTextContent('No notes');
  await act(() => {
    first.clear();
  });
  expect(screen.getByTestId('first')).toHaveTextContent('No notes');
  expect(screen.getByTestId('second')).toHaveTextContent('No notes');
});

const mocks = [
  {
    request: {
      query: SheltersDocument,
      variables: { pagination: { offset: 0, limit: 100 } },
    },
    maxUsageCount: 5,
    result: {
      data: {
        shelters: {
          __typename: 'ShelterTypeOffsetPaginated',
          totalCount: 2,
          results: [
            {
              __typename: 'ShelterType',
              id: 's-1',
              name: 'Alpha House',
              location: null,
              pets: [],
              demographics: [],
              accessibility: [],
            },
            {
              __typename: 'ShelterType',
              id: 's-2',
              name: 'Beta House',
              location: null,
              pets: [],
              demographics: [],
              accessibility: [],
            },
          ],
        },
      },
    },
  },
];

describe('shared create-flow state', () => {
  async function setup() {
    const store = createStore();
    store.startNew('client-1');
    const onSubmit = vi.fn().mockResolvedValue(true);
    await render(
      <MockedProvider mocks={mocks}>
        <ReferralDraftProvider store={store}>
          <ReferralCreateFlow
            clientId="client-1"
            onCancel={vi.fn()}
            onPause={vi.fn()}
            onSubmit={onSubmit}
          />
        </ReferralDraftProvider>
      </MockedProvider>,
    );
    return { store, onSubmit };
  }

  it('uses one source for answers, step, and shelter selection, including external changes', async () => {
    const { store } = await setup();
    await act(() => {
      store.setField('notes', 'Preserved observation');
      store.setStep('picker');
      store.setShelter('s-2');
    });
    expect(await screen.findByText('✓ Selected: Beta House')).toBeOnTheScreen();
    await act(() => {
      store.setShelter('s-1');
    });
    expect(screen.getByText('✓ Selected: Alpha House')).toBeOnTheScreen();
    await act(() => {
      store.setStep('intake');
    });
    expect(screen.getByDisplayValue('Preserved observation')).toBeOnTheScreen();
    await act(() => {
      store.clear();
    });
    expect(screen.queryByTestId('referral-intake-screen')).toBeNull();
  });

  it('does not show a replacement draft belonging to another client in the existing flow', async () => {
    const { store } = await setup();
    await act(() => {
      store.startNew('client-2');
    });
    expect(screen.queryByTestId('referral-intake-screen')).toBeNull();
    expect(store.getSnapshot()?.clientId).toBe('client-2');
  });

  it('submits the shared answers and the controlled shelter selection', async () => {
    const { store, onSubmit } = await setup();
    await act(() => {
      store.setField('pets', [PetChoices.Cats]);
    });
    await fireEvent.press(screen.getByTestId('intake-next-btn'));
    await screen.findByText('Alpha House');
    await fireEvent.press(screen.getAllByRole('radio')[0]);
    expect(store.getSnapshot()?.selectedShelterId).toBe('s-1');
    await act(() => {
      store.setField('notes', 'Latest observation');
    });
    await fireEvent.press(screen.getByTestId('submit-referral-btn'));
    expect(onSubmit).toHaveBeenCalledOnce();
    expect(store.getSnapshot()).toMatchObject({
      selectedShelterId: 's-1',
      answers: { notes: 'Latest observation', pets: ['CATS'] },
    });
  });
});

// These component fixtures use production-shaped IDs and the corresponding directory.
vi.mock('@monorepo/ba-platform', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@monorepo/ba-platform')>()),
  useApiConfig: () => ({ apiUrl: 'https://api.prod.betterangels.la' }),
}));
