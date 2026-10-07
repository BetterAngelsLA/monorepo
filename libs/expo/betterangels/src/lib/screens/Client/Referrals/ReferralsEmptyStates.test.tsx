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
import '@testing-library/react-native/build/matchers/extend-expect';
import { createTestApolloCache } from '../../../../__mocks__/apolloCache';
import { icons, svg, uiComponents } from '../../../../__mocks__/sharedBarrels';
import { MockedProvider } from '@apollo/client/testing/react';
import { render, screen } from '@testing-library/react-native';
import { AdaAccommodationEnum, VeteranStatusEnum } from '../../../apollo';
import { ReferralIntakeForm } from './ReferralIntakeForm';
import { ReferralsTab } from './ReferralsTab';
import { REFERRALS_PAGE_SIZE } from './constants';
import { ClientReferralsDocument } from './__generated__/Referrals.generated';
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
vi.mock('expo-router', () => ({ useRouter: () => ({ push: vi.fn() }) }));
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
  createReferralDraftStore({
    load: () => null,
    save: vi.fn(),
    remove: vi.fn(),
  });
let draftStore: ReferralDraftStore;

const CLIENT_ID = 'c-1';

const emptyReferrals = [
  {
    request: {
      query: ClientReferralsDocument,
      variables: {
        filters: { clientProfile: CLIENT_ID },
        pagination: { offset: 0, limit: REFERRALS_PAGE_SIZE },
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

  it('says there are no referrals yet instead of showing a blank screen', async () => {
    render(
      <MockedProvider cache={createTestApolloCache()} mocks={emptyReferrals}>
        <ReferralsTab client={client} draftStore={draftStore} />
      </MockedProvider>,
    );

    expect(await screen.findByText('No referrals yet')).toBeOnTheScreen();
  });

  it('tells the user how to create the first one', async () => {
    render(
      <MockedProvider cache={createTestApolloCache()} mocks={emptyReferrals}>
        <ReferralsTab client={client} draftStore={draftStore} />
      </MockedProvider>,
    );

    expect(
      await screen.findByText('Tap + to refer this client to a shelter.'),
    ).toBeOnTheScreen();
  });

  it('shows a spinner first, then replaces it with the empty message', async () => {
    render(
      <MockedProvider cache={createTestApolloCache()} mocks={emptyReferrals}>
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
    render(
      <MockedProvider cache={createTestApolloCache()} mocks={emptyReferrals}>
        <ReferralsTab client={client} draftStore={draftStore} />
      </MockedProvider>,
    );
    await screen.findByText('No referrals yet');

    expect(screen.getByLabelText('create new referral')).toBeOnTheScreen();
  });
});

describe('sparse client profile in the intake form', () => {
  const renderIntake = (
    profile: Parameters<typeof ReferralIntakeForm>[0]['profile'],
  ) =>
    render(
      <ReferralDraftProvider store={createStore()}>
        <ReferralIntakeForm
          onCancel={vi.fn()}
          onPause={vi.fn()}
          onContinue={vi.fn()}
          profile={profile}
        />
      </ReferralDraftProvider>,
    );

  it('marks every absent field "Not on file" rather than leaving it blank', () => {
    renderIntake({});

    // Name, Gender, Age, Accommodations, Veteran — five of the six rows.
    expect(screen.getAllByText('Not on file')).toHaveLength(5);
  });

  it('distinguishes an empty household from an unknown one', () => {
    renderIntake({});

    expect(screen.getByText('None on file')).toBeOnTheScreen();
  });

  it('renders the card at all when the profile is missing entirely', () => {
    renderIntake(null);

    expect(screen.getByText("From the client's profile")).toBeOnTheScreen();
    expect(screen.getAllByText('Not on file').length).toBeGreaterThan(0);
  });

  it('never leaks "undefined" into a value row', () => {
    renderIntake(null);

    expect(screen.queryByText(/undefined/)).toBeNull();
  });

  it('shows real values where they exist and placeholders where they do not', () => {
    // The value has to collide with neither a row label ("Veteran") nor the
    // intake form's own yes/no controls, or the assertion matches those instead
    // of the profile row it is meant to check.
    renderIntake({
      firstName: 'Client',
      lastName: 'One',
      veteranStatus: VeteranStatusEnum.PreferNotToSay,
      adaAccommodation: [AdaAccommodationEnum.Mobility],
    });

    expect(screen.getByText('Client One')).toBeOnTheScreen();
    // Enum values render as their display labels, not the wire names.
    expect(screen.getByText('Prefer not to say')).toBeOnTheScreen();
    expect(screen.getByText('Mobility')).toBeOnTheScreen();
    // Gender and Age are still absent.
    expect(screen.getAllByText('Not on file')).toHaveLength(2);
  });
});
