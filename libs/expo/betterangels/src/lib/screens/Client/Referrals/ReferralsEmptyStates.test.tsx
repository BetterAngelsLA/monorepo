import {
  AdaAccommodationEnum,
  VeteranStatusEnum,
} from '@monorepo/ba-platform/types';
import { createApolloCache } from '@monorepo/apollo';
import { createBaTypePolicies } from '../../../apollo/cachePolicies';
import { randomUUID } from 'node:crypto';
/**
 * T4 — the first screen a brand-new client shows.
 *
 * A client with no referrals and a bare profile is the very first thing a new
 * user meets, so "nothing here yet" has to read as intentional rather than as a
 * broken screen. Two failure modes matter and neither is a crash:
 *
 *   * a spinner that never resolves, or a blank view, where a message belongs
 *   * a profile card rendering empty rows (or "undefined") for absent fields
 *
 * Both look identical to an assertion that merely counts cards, which is why
 * these tests name the copy the user is supposed to see.
 *
 * Test-plan reference: referral-test-brief.md, case T4.
 */
import { icons, svg, uiComponents } from '../../../../__mocks__/sharedBarrels';
import { MockedProvider } from '@apollo/client/testing/react';
import { act, fireEvent, render, screen } from '@testing-library/react-native';
import * as notesAdapter from './referralIntakeSidecar';
import { ReferralIntakeForm } from './ReferralIntakeForm';
import { ReferralsTab } from './ReferralsTab';
import { ClientReferralsDocument } from './__generated__/Referrals.generated';
import {
  createReferralDraftStore,
  type ReferralDraftStore,
} from './referralDraft';
import { ReferralDraftProvider } from './ReferralDraftProvider';
vi.mock('expo-crypto', async () => ({
  randomUUID: (await import('node:crypto')).randomUUID,
}));
vi.mock('../../../providers/user/UserProvider', () => ({
  useUser: () => {
    throw new Error('Injected draft tests must not read account context');
  },
}));

// See sharedBarrels.tsx: the shared barrels pull in native-backed components
// whose native halves don't exist under test. `static` stays real.
vi.mock('@monorepo/expo/shared/ui-components', () => uiComponents());
vi.mock('@monorepo/expo/shared/icons', () => icons());
vi.mock('react-native-svg', () => svg());
vi.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 24, left: 0, right: 0 }),
}));
vi.mock('expo-web-browser', () => ({ openBrowserAsync: vi.fn() }));
vi.mock('expo-router', () => ({ useRouter: () => ({ push: vi.fn() }) }));
vi.mock('../../../hooks/snackbar/useSnackbar', () => ({
  default: () => ({ showSnackbar: vi.fn() }),
}));
vi.mock('../../../hooks', () => ({
  useSnackbar: () => ({ showSnackbar: vi.fn() }),
}));
vi.mock('../../../providers', () => ({
  useModalScreen: () => ({
    showModalScreen: vi.fn(),
    closeModalScreen: vi.fn(),
  }),
}));

const createStore = () =>
  createReferralDraftStore(
    {
      load: () => null,
      save: vi.fn(),
      remove: vi.fn(),
    },
    randomUUID,
  );
let draftStore: ReferralDraftStore;

const CLIENT_ID = 'c-1';

const emptyReferrals = [
  {
    request: {
      query: ClientReferralsDocument,
      variables: {
        filters: { clientProfile: CLIENT_ID },
        pagination: { offset: 0, limit: 25 },
      },
    },
    result: {
      data: {
        referrals: {
          __typename: 'ReferralTypeOffsetPaginated',
          totalCount: 0,
          results: [],
        },
      },
    },
  },
];

// Minimal shape ReferralsTab reads off the client profile.
const client = {
  clientProfile: {
    __typename: 'ClientProfileType' as const,
    id: CLIENT_ID,
    firstName: 'Client',
    lastName: 'Two',
  },
} as unknown as Parameters<typeof ReferralsTab>[0]['client'];

describe('empty referral history', () => {
  beforeEach(() => {
    draftStore = createStore();
  });

  it('keeps the list viewport above system navigation', async () => {
    await render(
      <MockedProvider
        cache={createApolloCache({ typePolicies: createBaTypePolicies(false) })}
        mocks={emptyReferrals}
      >
        <ReferralsTab client={client} draftStore={draftStore} />
      </MockedProvider>,
    );
    await screen.findByText('No referrals yet');
    expect(screen.getByTestId('referrals-screen')).toHaveStyle({
      paddingBottom: 24,
    });
  });

  it('says there are no referrals yet instead of showing a blank screen', async () => {
    await render(
      <MockedProvider
        cache={createApolloCache({ typePolicies: createBaTypePolicies(false) })}
        mocks={emptyReferrals}
      >
        <ReferralsTab client={client} draftStore={draftStore} />
      </MockedProvider>,
    );

    expect(await screen.findByText('No referrals yet')).toBeOnTheScreen();
  });

  it('tells the user how to create the first one', async () => {
    await render(
      <MockedProvider
        cache={createApolloCache({ typePolicies: createBaTypePolicies(false) })}
        mocks={emptyReferrals}
      >
        <ReferralsTab client={client} draftStore={draftStore} />
      </MockedProvider>,
    );

    expect(
      await screen.findByText('Tap + to refer this client to a shelter.'),
    ).toBeOnTheScreen();
  });

  it('shows a spinner first, then replaces it with the empty message', async () => {
    await render(
      <MockedProvider
        cache={createApolloCache({ typePolicies: createBaTypePolicies(false) })}
        mocks={emptyReferrals}
      >
        <ReferralsTab client={client} draftStore={draftStore} />
      </MockedProvider>,
    );

    // Assert the spinner is really there first — otherwise "it's gone" passes
    // for a spinner that never existed, and the test proves nothing.
    expect(screen.getByTestId('referrals-loading')).toBeOnTheScreen();

    await screen.findByText('No referrals yet');

    // A spinner left running is indistinguishable from a hung query to a user.
    expect(screen.queryByTestId('referrals-loading')).toBeNull();
  });

  it('still offers the + button so an empty history is not a dead end', async () => {
    await render(
      <MockedProvider
        cache={createApolloCache({ typePolicies: createBaTypePolicies(false) })}
        mocks={emptyReferrals}
      >
        <ReferralsTab client={client} draftStore={draftStore} />
      </MockedProvider>,
    );
    await screen.findByText('No referrals yet');

    expect(screen.getByLabelText('create new referral')).toBeOnTheScreen();
  });
});

it('does not reparse saved referrals when draft answers change, while draft controls stay live', async () => {
  const store = createStore();
  const decode = vi.spyOn(notesAdapter, 'decodeReferralNotes');
  try {
    await render(
      <MockedProvider
        cache={createApolloCache({ typePolicies: createBaTypePolicies(false) })}
        mocks={[
          {
            ...emptyReferrals[0],
            result: {
              data: {
                referrals: {
                  __typename: 'ReferralTypeOffsetPaginated',
                  totalCount: 1,
                  results: [
                    {
                      __typename: 'ReferralType',
                      id: 'saved-1',
                      status: 'PENDING',
                      createdAt: '2026-10-14T12:00:00Z',
                      notes: 'Saved observation',
                      createdBy: null,
                      shelter: null,
                    },
                  ],
                },
              },
            },
          },
        ]}
      >
        <ReferralsTab client={client} draftStore={store} />
      </MockedProvider>,
    );
    await screen.findByText('Notes: Saved observation');
    const parsed = decode.mock.calls.length;
    expect(parsed).toBeGreaterThan(0);
    await act(() => {
      store.startNew(CLIENT_ID);
    });
    expect(screen.getByTestId('resume-referral-btn')).toBeOnTheScreen();
    for (const value of ['F', 'Fi', 'Fictional observation']) {
      await act(() => {
        store.setField('notes', value);
      });
    }
    expect(decode).toHaveBeenCalledTimes(parsed);
    expect(screen.getByTestId('referral-draft-card')).toBeOnTheScreen();
    await act(() => {
      store.clear();
    });
    expect(screen.getByTestId('create-referral-btn')).toBeOnTheScreen();
    expect(screen.queryByTestId('referral-draft-card')).toBeNull();
    expect(decode).toHaveBeenCalledTimes(parsed);
  } finally {
    decode.mockRestore();
  }
});

it('passes current profile details through the saved card to its reviewed export', async () => {
  if (!client) throw new Error('Missing fictional client fixture');
  const fullClient = {
    ...client,
    clientProfile: {
      ...client.clientProfile,
      age: 35,
      displayGender: 'Woman',
      adaAccommodation: [AdaAccommodationEnum.Mobility],
    },
  };
  await render(
    <MockedProvider
      cache={createApolloCache({ typePolicies: createBaTypePolicies(false) })}
      mocks={[
        {
          ...emptyReferrals[0],
          result: {
            data: {
              referrals: {
                __typename: 'ReferralTypeOffsetPaginated',
                totalCount: 1,
                results: [
                  {
                    __typename: 'ReferralType',
                    id: 'profile-export',
                    status: 'PENDING',
                    createdAt: '2026-10-15T12:00:00Z',
                    notes: null,
                    createdBy: null,
                    shelter: null,
                  },
                ],
              },
            },
          },
        },
      ]}
    >
      <ReferralsTab client={fullClient} draftStore={createStore()} />
    </MockedProvider>,
  );
  await screen.findByTestId('share-referral-profile-export');
  await fireEvent.press(screen.getByTestId('share-referral-profile-export'));
  expect(screen.getByTestId('referral-share-preview')).toHaveTextContent(
    /Age: 35/,
  );
  expect(screen.getByTestId('referral-share-preview')).toHaveTextContent(
    /Gender: Woman/,
  );
  expect(screen.getByTestId('referral-share-preview')).toHaveTextContent(
    /Accommodations \[Sensitive\]: Excluded \(sensitive\)/,
  );
  await fireEvent.press(screen.getByTestId('referral-share-include-private'));
  expect(screen.getByTestId('referral-share-preview')).toHaveTextContent(
    /Accommodations \[Sensitive\]: Mobility/,
  );
});

describe('sparse client profile in the intake form', () => {
  const renderIntake = async (
    profile: Parameters<typeof ReferralIntakeForm>[0]['profile'],
  ) =>
    await render(
      <ReferralDraftProvider store={createStore()}>
        <ReferralIntakeForm
          onCancel={vi.fn()}
          onPause={vi.fn()}
          onContinue={vi.fn()}
          profile={profile}
        />
      </ReferralDraftProvider>,
    );

  it('marks every absent field "Not on file" rather than leaving it blank', async () => {
    await renderIntake({});

    // Name, Gender, Age (DOB), Mobility, Veteran — five of the six rows.
    expect(screen.getAllByText('Not on file')).toHaveLength(5);
  });

  it('distinguishes an empty household from an unknown one', async () => {
    await renderIntake({});

    expect(screen.getByText('None on file')).toBeOnTheScreen();
  });

  it('renders the card at all when the profile is missing entirely', async () => {
    await renderIntake(null);

    expect(screen.getByText("From the client's profile")).toBeOnTheScreen();
    expect(screen.getAllByText('Not on file').length).toBeGreaterThan(0);
  });

  it('never leaks "undefined" into a value row', async () => {
    await renderIntake(null);

    expect(screen.queryByText(/undefined/)).toBeNull();
  });

  it('shows real values where they exist and placeholders where they do not', async () => {
    // The value has to collide with neither a row label ("Veteran") nor the
    // intake form's own yes/no controls, or the assertion matches those instead
    // of the profile row it is meant to check.
    await renderIntake({
      firstName: 'Client',
      lastName: 'One',
      veteranStatus: VeteranStatusEnum.Yes,
    });

    expect(screen.getByText('Client One')).toBeOnTheScreen();
    expect(screen.getAllByText('Yes').length).toBeGreaterThan(0);
    // Gender, DOB and Mobility are still absent.
    expect(screen.getAllByText('Not on file')).toHaveLength(3);
  });
});

// These component fixtures use production-shaped IDs and the corresponding directory.
vi.mock('@monorepo/ba-platform', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@monorepo/ba-platform')>()),
  useApiConfig: () => ({ apiUrl: 'https://api.prod.betterangels.la' }),
}));
