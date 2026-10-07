/**
 * The draft card's affordances, wired to the real store.
 *
 * The Maestro draft flow covers these on a device; these tests pin the wiring
 * between the card and the store (discard clears the draft, resume opens the
 * form) so a broken handler fails here instead of only in e2e.
 */
import '@testing-library/react-native/build/matchers/extend-expect';
import { MockedProvider } from '@apollo/client/testing/react';
import {
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react-native';
import { createTestApolloCache } from '../../../../__mocks__/apolloCache';
import { icons, svg, uiComponents } from '../../../../__mocks__/sharedBarrels';
import { ReferralsTab } from './ReferralsTab';
import { REFERRALS_PAGE_SIZE } from './constants';
import { ClientReferralsDocument } from './__generated__/Referrals.generated';
import { createReferralDraftStore } from './referralDraft';

vi.mock('@monorepo/expo/shared/ui-components', () => uiComponents());
vi.mock('@monorepo/expo/shared/icons', () => icons());
vi.mock('react-native-svg', () => svg());
vi.mock('expo-web-browser', () => ({ openBrowserAsync: vi.fn() }));
vi.mock('expo-router', () => ({ useRouter: () => ({ navigate: vi.fn() }) }));
const { showModalScreen } = vi.hoisted(() => ({ showModalScreen: vi.fn() }));
vi.mock('../../../providers', () => ({
  useModalScreen: () => ({ showModalScreen, closeModalScreen: vi.fn() }),
}));
vi.mock('../../../hooks', () => ({
  useSnackbar: () => ({ showSnackbar: vi.fn() }),
}));

const CLIENT_ID = 'c-1';

// Minimal shape ReferralsTab reads off the client profile.
const client = {
  clientProfile: {
    __typename: 'ClientProfileType' as const,
    id: CLIENT_ID,
    firstName: 'Client',
    lastName: 'Two',
  },
} as unknown as Parameters<typeof ReferralsTab>[0]['client'];

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

const renderTabWithDraft = () => {
  const store = createReferralDraftStore({
    load: () => null,
    save: vi.fn(),
    remove: vi.fn(),
  });
  store.startNew(CLIENT_ID);
  render(
    <MockedProvider cache={createTestApolloCache()} mocks={emptyReferrals}>
      <ReferralsTab client={client} draftStore={store} />
    </MockedProvider>,
  );
  return store;
};

beforeEach(() => {
  showModalScreen.mockClear();
});

describe('referral draft card', () => {
  it('discards the draft from the card and brings back the + button', async () => {
    const store = renderTabWithDraft();

    expect(await screen.findByTestId('referral-draft-card')).toBeOnTheScreen();
    // While a draft exists the header offers Resume, not +.
    expect(screen.queryByTestId('create-referral-btn')).toBeNull();

    fireEvent.press(screen.getByTestId('draft-discard-btn'));

    await waitFor(() =>
      expect(screen.queryByTestId('referral-draft-card')).toBeNull(),
    );
    expect(store.getSnapshot()).toBeNull();
    expect(screen.getByTestId('create-referral-btn')).toBeOnTheScreen();
  });

  it('resumes the form when the card is tapped', async () => {
    renderTabWithDraft();

    fireEvent.press(await screen.findByTestId('referral-draft-card'));

    expect(showModalScreen).toHaveBeenCalledWith(
      expect.objectContaining({ title: 'Refer to Shelter' }),
    );
  });
});
