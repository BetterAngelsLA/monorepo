import { ApolloLink } from '@apollo/client';
import { MockLink } from '@apollo/client/testing';
import { MockedProvider } from '@apollo/client/testing/react';
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react-native';
import { useState } from 'react';
import { Alert } from 'react-native';
import { Observable } from 'rxjs';
import {
  OperationMessageKind,
  ReferralStatusEnum,
} from '@monorepo/ba-platform/types';
import { createTestApolloCache } from '../../../../__mocks__/apolloCache';
import { icons, svg, uiComponents } from '../../../../__mocks__/sharedBarrels';
import { ModalScreenContext } from '../../../providers/modalScreen/ModalScreenContext';
import type { TShowModalScreenProps } from '../../../providers/modalScreen/types';
import type { ClientProfileQuery } from '../__generated__/Client.generated';
import { ReferralsTab } from './ReferralsTab';
import { REFERRALS_PAGE_SIZE, SHELTERS_PAGE_SIZE } from './constants';
import { createReferralDraftStore } from './referralDraft';
import {
  buildReferralNotes,
  decodeReferralNotes,
} from './referralIntakeSidecar';
import {
  ClientReferralsDocument,
  type ClientReferralsQuery,
  type CreateReferralMutation,
} from './__generated__/Referrals.generated';
import {
  SheltersDocument,
  type SheltersQuery,
} from './__generated__/Shelters.generated';

vi.mock('@monorepo/expo/shared/ui-components', () => uiComponents());
vi.mock('@monorepo/expo/shared/icons', () => icons());
vi.mock('react-native-svg', () => svg());
vi.mock('expo-web-browser', () => ({ openBrowserAsync: vi.fn() }));
vi.mock('expo-router', () => ({ useRouter: () => ({ navigate: vi.fn() }) }));
vi.mock(
  '../../../providers',
  async () => import('../../../providers/modalScreen/useModalScreen'),
);
const { showSnackbar } = vi.hoisted(() => ({ showSnackbar: vi.fn() }));
vi.mock('../../../hooks', () => ({ useSnackbar: () => ({ showSnackbar }) }));

const client: ClientProfileQuery = {
  __typename: 'Query',
  clientProfile: {
    __typename: 'ClientProfileType',
    id: 'client-1',
    firstName: 'Test',
    displayCaseManager: '',
  },
};
const shelter: SheltersQuery['shelters']['results'][number] = {
  __typename: 'ShelterType',
  id: 's-1',
  name: 'Alpha House',
  phone: null,
  location: null,
  pets: [],
  demographics: [],
  accessibility: [],
};
const answers = {
  notes: 'Unique referral observation',
  substances: 'Fictional sensitive answer',
  selfcare: 'No',
  consent: true,
};
const notes = buildReferralNotes(answers);
const created: CreateReferralMutation = {
  __typename: 'Mutation',
  createReferral: {
    __typename: 'ReferralType',
    id: 'new-referral',
  },
};
const newReferral: ClientReferralsQuery['referrals']['results'][number] = {
  __typename: 'ReferralType',
  id: 'new-referral',
  status: ReferralStatusEnum.Pending,
  createdAt: '2026-09-07T12:00:00Z',
  shelter,
  createdBy: null,
  notes,
};

type PendingSubmission = {
  variables: ApolloLink.Operation['variables'];
  succeed: (result: ApolloLink.Result<CreateReferralMutation>) => void;
  fail: (error: Error) => void;
};

async function setup(options?: {
  initialReferrals?: ClientReferralsQuery['referrals']['results'];
  refreshedReferrals?: ClientReferralsQuery['referrals']['results'];
}) {
  const initialReferrals = options?.initialReferrals ?? [];
  const refreshedReferrals = options?.refreshedReferrals ?? [newReferral];
  const store = createReferralDraftStore({
    load: () => null,
    save: vi.fn(),
    remove: vi.fn(),
  });
  const requests: PendingSubmission[] = [];
  const refreshed = vi.fn(() => ({
    data: {
      referrals: {
        __typename: 'ReferralTypeOffsetPaginated',
        totalCount: refreshedReferrals.length,
        results: refreshedReferrals,
      },
    },
  }));
  // Keep Apollo's real hooks and error handling. Only the transport and native
  // modal presentation are replaced; each test explicitly completes its request.
  const link = ApolloLink.from([
    new ApolloLink((operation, forward) => {
      if (operation.operationName !== 'CreateReferral')
        return forward(operation);
      return new Observable((observer) => {
        requests.push({
          variables: operation.variables,
          succeed: (result) => {
            observer.next(result);
            observer.complete();
          },
          fail: (error) => observer.error(error),
        });
      });
    }),
    new MockLink([
      {
        request: {
          query: ClientReferralsDocument,
          variables: {
            filters: { clientProfile: 'client-1' },
            pagination: { offset: 0, limit: REFERRALS_PAGE_SIZE },
          },
        },
        delay: 0,
        result: {
          data: {
            referrals: {
              __typename: 'ReferralTypeOffsetPaginated',
              totalCount: initialReferrals.length,
              results: initialReferrals,
            },
          },
        },
      },
      {
        request: {
          query: ClientReferralsDocument,
          variables: {
            filters: { clientProfile: 'client-1' },
            pagination: { offset: 0, limit: REFERRALS_PAGE_SIZE },
          },
        },
        delay: 0,
        result: refreshed,
      },
      {
        request: {
          query: SheltersDocument,
          variables: { pagination: { offset: 0, limit: SHELTERS_PAGE_SIZE } },
        },
        delay: 0,
        // The picker refetches on every entry to it (cache-and-network), and the
        // round-trip test enters it twice because Back unmounts it. MockLink
        // serves each entry once by default.
        maxUsageCount: 2,
        result: {
          data: {
            shelters: {
              __typename: 'ShelterTypeOffsetPaginated',
              totalCount: 1,
              results: [shelter],
            },
          },
        },
      },
    ]),
  ]);
  const close = vi.fn();
  const opened = vi.fn<(props: TShowModalScreenProps) => void>();
  function Harness() {
    const [modal, setModal] = useState<TShowModalScreenProps | null>(null);
    return (
      <ModalScreenContext.Provider
        value={{
          showModalScreen: (props) => {
            opened(props);
            setModal(props);
          },
          content: null,
          presentation: 'fullScreenModal',
        }}
      >
        <ReferralsTab client={client} draftStore={store} />
        {modal?.renderContent({
          close: () => {
            close();
            setModal(null);
          },
        })}
      </ModalScreenContext.Provider>
    );
  }
  await render(
    <MockedProvider cache={createTestApolloCache()} link={link}>
      <Harness />
    </MockedProvider>,
  );
  return { store, requests, refreshed, close, opened };
}

async function openPicker({ expectEmptyState = true } = {}) {
  if (expectEmptyState) {
    await screen.findByText('No referrals yet');
  } else {
    await screen.findByTestId(/^referral-card-/);
  }
  await fireEvent.press(screen.getByTestId('create-referral-btn'));
  await fireEvent.changeText(
    screen.getByLabelText('Staff Observations / Notes'),
    answers.notes,
  );
  await fireEvent.changeText(
    screen.getByLabelText('Substances'),
    answers.substances,
  );
  await fireEvent.press(screen.getByTestId('selfcare-no-btn'));
  await fireEvent.press(
    screen.getByRole('checkbox', { name: /Client gave consent/ }),
  );
  await fireEvent.press(screen.getByTestId('intake-next-btn'));
  // Wait for the picker's own row: "Alpha House" also appears on an existing
  // referral card, so the text alone does not prove the shelter list loaded.
  await fireEvent.press(await screen.findByTestId('shelter-option-radio'));
}

async function submit(requests: PendingSubmission[], expectedCount = 1) {
  // Deliberately not awaited: the CreateReferral observable stays pending until the
  // test resolves it, and React's async act would keep waiting on that promise.
  // waitFor below still runs inside act, so the resulting updates are flushed.
  void fireEvent.press(screen.getByTestId('submit-referral-btn'));
  await waitFor(() => expect(requests).toHaveLength(expectedCount));
  const request = requests[expectedCount - 1];
  if (!request) throw new Error('Expected a pending submission');
  return request;
}

beforeEach(() => {
  showSnackbar.mockClear();
});

it('submits current answers once, consumes the draft only on success, and displays the refetched record with sensitive values masked', async () => {
  const { store, requests, refreshed, close, opened } = await setup();
  await openPicker();
  expect(opened).toHaveBeenCalledExactlyOnceWith(
    expect.objectContaining({
      title: 'Refer to Shelter',
      header: { mode: 'custom', buttonRight: null },
    }),
  );
  const before = store.getSnapshot();
  const request = await submit(requests);
  expect(request.variables).toEqual({
    data: { clientProfile: 'client-1', shelter: 's-1', notes },
  });
  expect(decodeReferralNotes(request.variables.data.notes)).toEqual({
    humanNotes: answers.notes,
    intake: { substances: answers.substances, selfcare: 'No', consent: true },
  });
  expect(screen.getByTestId('submit-referral-btn')).toBeDisabled();
  await fireEvent.press(screen.getByTestId('submit-referral-btn'));
  expect(requests).toHaveLength(1);
  expect(store.getSnapshot()).toBe(before);
  expect(close).not.toHaveBeenCalled();
  expect(refreshed).not.toHaveBeenCalled();
  expect(showSnackbar).not.toHaveBeenCalled();

  await act(async () => request.succeed({ data: created }));
  const card = await screen.findByTestId('referral-card-new-referral');
  expect(within(card).getByText(`Notes: ${answers.notes}`)).toBeOnTheScreen();
  expect(within(card).getByText(/Substances: ••••/)).toBeOnTheScreen();
  expect(
    within(card).getByText(/Able to practice self-care: No/),
  ).toBeOnTheScreen();
  expect(
    within(card).getByText(/DHS data-sharing consent: Yes/),
  ).toBeOnTheScreen();
  expect(screen.queryByText(new RegExp(answers.substances))).toBeNull();
  expect(store.getSnapshot()).toBeNull();
  expect(screen.queryByTestId('shelter-picker-screen')).toBeNull();
  expect(screen.queryByTestId('referral-draft-card')).toBeNull();
  expect(screen.getByTestId('create-referral-btn')).toBeOnTheScreen();
  expect(close).toHaveBeenCalledOnce();
  expect(refreshed).toHaveBeenCalledOnce();
  expect(showSnackbar).toHaveBeenCalledExactlyOnceWith({
    message: 'Referral submitted successfully!',
    type: 'success',
  });
});

it('keeps every already-loaded row when a create refetches a shifted page', async () => {
  // The referrals field is offset-merged and a create prepends itself, so the
  // refetch sees a shifted list (new row first, older rows moved down). Both
  // rows must still render — no hole where the new row was, no dropped row.
  const existing = { ...newReferral, id: 'existing-referral' };
  const { requests, refreshed } = await setup({
    initialReferrals: [existing],
    refreshedReferrals: [newReferral, existing],
  });

  await openPicker({ expectEmptyState: false });

  const request = await submit(requests);
  await act(async () => request.succeed({ data: created }));

  await screen.findByTestId('referral-card-new-referral');
  expect(refreshed).toHaveBeenCalledOnce();
  // Both rows render — none replaced by a hole.
  expect(screen.getAllByTestId(/^referral-card-/)).toHaveLength(2);
});

it.each([OperationMessageKind.Permission, OperationMessageKind.Validation])(
  'preserves the draft and allows retry after a %s response',
  async (kind) => {
    const { store, requests, refreshed, close } = await setup();
    await openPicker();
    const before = store.getSnapshot();
    const request = await submit(requests);
    await act(async () =>
      request.succeed({
        data: {
          __typename: 'Mutation',
          createReferral: {
            __typename: 'OperationInfo',
            messages: [
              {
                __typename: 'OperationMessage',
                kind,
                field: 'shelter',
                message: 'Unable to submit this referral.',
              },
            ],
          },
        },
      }),
    );
    expect(showSnackbar).toHaveBeenCalledExactlyOnceWith({
      message: 'Unable to submit this referral.',
      type: 'error',
    });
    expect(store.getSnapshot()).toBe(before);
    expect(close).not.toHaveBeenCalled();
    expect(refreshed).not.toHaveBeenCalled();
    expect(screen.getByText('✓ Selected: Alpha House')).toBeOnTheScreen();
    expect(screen.getByTestId('submit-referral-btn')).toBeEnabled();
    const retry = await submit(requests, 2);
    expect(retry.variables).toEqual(request.variables);
    await act(async () => retry.succeed({ data: created }));
    await screen.findByTestId('referral-card-new-referral');
    expect(store.getSnapshot()).toBeNull();
    expect(close).toHaveBeenCalledOnce();
  },
);

it('does not surface an ERROR-kind OperationInfo message', async () => {
  // `Error` is strawberry-django's catch-all kind and its message can be raw
  // exception text, so only validation/permission messages reach the user.
  const { store, requests } = await setup();
  await openPicker();
  const before = store.getSnapshot();
  const request = await submit(requests);

  await act(async () =>
    request.succeed({
      data: {
        __typename: 'Mutation',
        createReferral: {
          __typename: 'OperationInfo',
          messages: [
            {
              __typename: 'OperationMessage',
              kind: OperationMessageKind.Error,
              field: null,
              message: 'duplicate key value violates unique constraint',
            },
          ],
        },
      },
    }),
  );

  expect(showSnackbar).toHaveBeenCalledExactlyOnceWith({
    message: 'Error creating referral. Please try again.',
    type: 'error',
  });
  expect(store.getSnapshot()).toBe(before);
  expect(screen.getByTestId('submit-referral-btn')).toBeEnabled();
});

it('keeps the draft after a network error and submits current answers when retried', async () => {
  const logged = vi.spyOn(console, 'error').mockImplementation(() => undefined);
  try {
    const { store, requests, close, refreshed } = await setup();
    await openPicker();
    const before = store.getSnapshot();
    const request = await submit(requests);
    const error = new Error('Test connection unavailable');
    await act(async () => request.fail(error));
    expect(logged).toHaveBeenCalledWith(error);
    expect(showSnackbar).toHaveBeenCalledExactlyOnceWith({
      message: 'Error creating referral. Please try again.',
      type: 'error',
    });
    expect(store.getSnapshot()).toBe(before);
    expect(close).not.toHaveBeenCalled();
    expect(refreshed).not.toHaveBeenCalled();
    expect(screen.getByTestId('submit-referral-btn')).toBeEnabled();
    await act(async () => {
      store.setField('notes', 'Updated before retry');
    });
    const retry = await submit(requests, 2);
    expect(decodeReferralNotes(retry.variables.data.notes)).toEqual({
      humanNotes: 'Updated before retry',
      intake: { substances: answers.substances, selfcare: 'No', consent: true },
    });
    await act(async () => retry.succeed({ data: created }));
    await waitFor(() => expect(store.getSnapshot()).toBeNull());
  } finally {
    logged.mockRestore();
  }
});

it('shows a fallback error for an OperationInfo response without messages', async () => {
  const { store, requests } = await setup();
  await openPicker();
  const before = store.getSnapshot();
  const request = await submit(requests);
  await act(async () =>
    request.succeed({
      data: {
        __typename: 'Mutation',
        createReferral: { __typename: 'OperationInfo', messages: [] },
      },
    }),
  );
  expect(showSnackbar).toHaveBeenCalledExactlyOnceWith({
    message: 'Error creating referral. Please try again.',
    type: 'error',
  });
  expect(store.getSnapshot()).toBe(before);
  expect(screen.getByTestId('submit-referral-btn')).toBeEnabled();
});

it.each<ApolloLink.Result<CreateReferralMutation>>([
  {},
  { data: null },
  {
    data: {
      __typename: 'Mutation',
      createReferral: {
        __typename: 'ReferralType',
        id: '',
      },
    },
  },
])(
  'does not consume the draft without confirmation of a created referral: %j',
  async (response) => {
    const logged = vi
      .spyOn(console, 'error')
      .mockImplementation(() => undefined);
    try {
      const { store, requests, close, refreshed } = await setup();
      await openPicker();
      const before = store.getSnapshot();
      const request = await submit(requests);
      await act(async () => request.succeed(response));
      expect(showSnackbar).toHaveBeenCalledExactlyOnceWith({
        message: 'Error creating referral. Please try again.',
        type: 'error',
      });
      expect(store.getSnapshot()).toBe(before);
      expect(close).not.toHaveBeenCalled();
      expect(refreshed).not.toHaveBeenCalled();
      expect(screen.getByTestId('submit-referral-btn')).toBeEnabled();
    } finally {
      logged.mockRestore();
    }
  },
);

it("asks before replacing another client's draft and only replaces on confirm", async () => {
  const { store, opened } = await setup();
  await act(async () => {
    store.startNew('another-client');
  });
  const alertSpy = vi.spyOn(Alert, 'alert').mockImplementation(() => undefined);

  try {
    await fireEvent.press(screen.getByTestId('create-referral-btn'));

    expect(store.getSnapshot()?.clientId).toBe('another-client');
    expect(opened).not.toHaveBeenCalled();
    expect(alertSpy.mock.calls[0]?.[0]).toBe(
      'Replace the in-progress referral?',
    );

    const cancel = alertSpy.mock.calls[0]?.[2]?.find(
      (button) => button.text === 'Cancel',
    );
    await act(() => cancel?.onPress?.(undefined));
    expect(store.getSnapshot()?.clientId).toBe('another-client');
    expect(opened).not.toHaveBeenCalled();

    await fireEvent.press(screen.getByTestId('create-referral-btn'));
    const replace = alertSpy.mock.calls[1]?.[2]?.find(
      (button) => button.text === 'Replace',
    );
    await act(() => replace?.onPress?.(undefined));

    expect(store.getSnapshot()?.clientId).toBe('client-1');
    expect(opened).toHaveBeenCalledOnce();
  } finally {
    alertSpy.mockRestore();
  }
});

it('returns from the picker to the intake form and forward again without losing answers or the selection', async () => {
  const { store } = await setup();
  // openPicker leaves the draft parked on the picker step — the state a tester
  // resumes into.
  await openPicker();

  await fireEvent.press(screen.getByTestId('picker-back-btn'));

  expect(await screen.findByTestId('referral-intake-screen')).toBeOnTheScreen();
  expect(store.getSnapshot()?.step).toBe('intake');
  expect(
    screen.getByLabelText('Staff Observations / Notes'),
  ).toHaveDisplayValue(answers.notes);
  expect(screen.getByLabelText('Substances')).toHaveDisplayValue(
    answers.substances,
  );

  await fireEvent.press(screen.getByTestId('intake-next-btn'));

  expect(await screen.findByTestId('shelter-picker-screen')).toBeOnTheScreen();
  // The shelter picked before going back is still selected.
  expect(await screen.findByText('✓ Selected: Alpha House')).toBeOnTheScreen();
});
