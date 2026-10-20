import { createApolloCache } from '@monorepo/apollo';
import { createBaTypePolicies } from '../../../apollo/cachePolicies';
import { randomUUID } from 'node:crypto';
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
import { Pressable, Text } from 'react-native';
import { Observable } from 'rxjs';
import {
  OperationMessageKind,
  ReferralStatusEnum,
} from '@monorepo/ba-platform/types';
import { icons, svg, uiComponents } from '../../../../__mocks__/sharedBarrels';
import { ModalScreenContext } from '../../../providers/modalScreen/ModalScreenContext';
import type { TShowModalScreenProps } from '../../../providers/modalScreen/types';
import type { ClientProfileQuery } from '../__generated__/Client.generated';
import { ReferralsTab } from './ReferralsTab';
import { createReferralDraftStore } from '../../../draft/referralDraft';
import {
  buildReferralNotes,
  decodeReferralNotes,
} from './referralIntakeSidecar';
import {
  ClientReferralsDocument,
  type ClientReferralsQuery,
  type CreateReferralMutation,
  type UpdateReferralMutation,
} from './__generated__/Referrals.generated';
import {
  SheltersDocument,
  type SheltersQuery,
} from './__generated__/Shelters.generated';
vi.mock('expo-crypto', async () => ({
  randomUUID: (await import('node:crypto')).randomUUID,
}));
vi.mock('../../../providers/user/UserProvider', () => ({
  useUser: () => {
    throw new Error('Injected draft tests must not read account context');
  },
}));

vi.mock('@monorepo/expo/shared/ui-components', () => uiComponents());
// The screen always supplies ReferralPermissionsProvider; these harnesses stub
// the active-org hook so the injected-store path has deterministic gates.
const gates = vi.hoisted(() => ({
  canView: true,
  canCreate: true,
  canChange: true,
}));
vi.mock('../../../hooks/referral/useReferralGates', () => ({
  useActiveReferralGates: () => gates,
}));

vi.mock('@monorepo/expo/shared/icons', () => icons());
vi.mock('react-native-svg', () => svg());
vi.mock('expo-web-browser', () => ({ openBrowserAsync: vi.fn() }));
vi.mock('expo-router', () => ({ useRouter: () => ({ navigate: vi.fn() }) }));
vi.mock(
  '../../../providers',
  async () => import('../../../providers/modalScreen/useModalScreen'),
);
const { showSnackbar } = vi.hoisted(() => ({ showSnackbar: vi.fn() }));
vi.mock('../../../hooks/snackbar/useSnackbar', () => ({
  default: () => ({ showSnackbar }),
}));
// Other referral components still use the hooks barrel; keep it stubbed
// so expo-updates is not loaded in this native test.
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
  location: null,
  pets: [],
  demographics: [],
  accessibility: [],
};
const answers = {
  notes: 'Unique referral observation',
  substances: 'Fictional sensitive answer',
  selfcare: 'No',
  consent: 'Yes',
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
  operationName: string;
  variables: ApolloLink.Operation['variables'];
  succeed: (
    result: ApolloLink.Result<CreateReferralMutation | UpdateReferralMutation>,
  ) => void;
  fail: (error: Error) => void;
};

async function setup(
  initialReferrals: ClientReferralsQuery['referrals']['results'] = [],
  laterReferrals: ClientReferralsQuery['referrals']['results'] = [],
) {
  const store = createReferralDraftStore(
    {
      load: () => null,
      save: vi.fn(),
      remove: vi.fn(),
    },
    randomUUID,
  );
  const requests: PendingSubmission[] = [];
  let availableShelters = [shelter];
  const loadShelters = vi.fn(() => ({
    data: {
      shelters: {
        __typename: 'ShelterTypeOffsetPaginated',
        totalCount: availableShelters.length,
        results: availableShelters,
      },
    },
  }));
  const refreshed = vi.fn(() => ({
    data: {
      referrals: {
        __typename: 'ReferralTypeOffsetPaginated',
        totalCount: 1,
        results: [newReferral],
      },
    },
  }));
  // Keep Apollo's real hooks and error handling. Only the transport and native
  // modal presentation are replaced; each test explicitly completes its request.
  const link = ApolloLink.from([
    new ApolloLink((operation, forward) => {
      if (
        !['CreateReferral', 'UpdateReferral'].includes(
          operation.operationName ?? '',
        )
      )
        return forward(operation);
      return new Observable((observer) => {
        requests.push({
          operationName: operation.operationName ?? '',
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
            pagination: { offset: 25, limit: 25 },
          },
        },
        delay: 0,
        result: {
          data: {
            __typename: 'Query',
            referrals: {
              __typename: 'ReferralTypeOffsetPaginated',
              totalCount: initialReferrals.length + laterReferrals.length,
              results: laterReferrals,
            },
          },
        },
      },
      {
        request: {
          query: ClientReferralsDocument,
          variables: {
            filters: { clientProfile: 'client-1' },
            pagination: { offset: 0, limit: 25 },
          },
        },
        delay: 0,
        result: {
          data: {
            referrals: {
              __typename: 'ReferralTypeOffsetPaginated',
              totalCount: initialReferrals.length + laterReferrals.length,
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
            pagination: { offset: 0, limit: 25 },
          },
        },
        delay: 0,
        result: refreshed,
        maxUsageCount: 5,
      },
      {
        request: {
          query: SheltersDocument,
          variables: { pagination: { offset: 0, limit: 100 } },
        },
        maxUsageCount: 5,
        delay: 0,
        result: loadShelters,
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
        <Pressable
          testID="open-other-modal"
          accessibilityRole="button"
          onPress={() =>
            setModal({ renderContent: () => <Text>Another screen</Text> })
          }
        >
          <Text>Open another screen</Text>
        </Pressable>
        {modal?.renderContent({
          close: () => {
            close();
            modal.onClose?.();
            setModal(null);
          },
        })}
      </ModalScreenContext.Provider>
    );
  }
  await render(
    <MockedProvider
      cache={createApolloCache({ typePolicies: createBaTypePolicies(false) })}
      link={link}
    >
      <Harness />
    </MockedProvider>,
  );
  return {
    store,
    requests,
    refreshed,
    close,
    opened,
    loadShelters,
    setAvailableShelters: (next: typeof availableShelters) => {
      availableShelters = next;
    },
  };
}

async function openPicker() {
  await screen.findByText('No referrals yet');
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
  await fireEvent.press(screen.getByTestId('consent-yes-btn'));
  await fireEvent.press(screen.getByTestId('intake-next-btn'));
  await screen.findByText('Alpha House');
  await fireEvent.press(screen.getByRole('radio'));
}

async function submit(requests: PendingSubmission[], expectedCount = 1) {
  await fireEvent.press(screen.getByTestId('submit-referral-btn'));
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
    intake: { substances: answers.substances, selfcare: 'No', consent: 'Yes' },
  });
  expect(screen.getByTestId('submit-referral-btn')).toBeDisabled();
  await fireEvent.press(screen.getByTestId('submit-referral-btn'));
  expect(requests).toHaveLength(1);
  expect(store.getSnapshot()?.storedValues).toEqual(before?.storedValues);
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
    message: 'Referral saved. Share it separately to provide a copy.',
    type: 'success',
  });
});

const GENERIC_SAVE_ERROR =
  'The referral was not saved. Check your information and permissions, then try again.';

it.each([
  [OperationMessageKind.Permission, 'Unable to submit this referral.'],
  [OperationMessageKind.Validation, 'Unable to submit this referral.'],
  [OperationMessageKind.Error, GENERIC_SAVE_ERROR],
])('preserves the draft and allows retry after a %s response', async (kind, expectedMessage) => {
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
    // Permission and validation messages are actionable; the `Error` kind can
    // carry raw exception text, so it must stay generic.
    message: expectedMessage,
    type: 'error',
  });
  expect(store.getSnapshot()?.storedValues).toEqual(before?.storedValues);
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
    expect(logged).not.toHaveBeenCalled();
    expect(showSnackbar).toHaveBeenCalledExactlyOnceWith({
      message:
        'Could not confirm whether the referral was saved. Check the referral list before trying again.',
      type: 'error',
    });
    expect(store.getSnapshot()?.storedValues).toEqual(before?.storedValues);
    expect(close).not.toHaveBeenCalled();
    expect(refreshed).not.toHaveBeenCalled();
    expect(screen.queryByTestId('submit-referral-btn')).toBeNull();
    expect(store.getSnapshot()?.submission.status).toBe('uncertain');
    await fireEvent.press(screen.getByTestId('confirm-referral-retry-btn'));
    await waitFor(() =>
      expect(screen.getByTestId('submit-referral-btn')).toBeEnabled(),
    );
    await act(() => {
      store.setField('notes', 'Updated before retry');
    });
    const retry = await submit(requests, 2);
    expect(decodeReferralNotes(retry.variables.data.notes)).toEqual({
      humanNotes: 'Updated before retry',
      intake: { substances: answers.substances, selfcare: 'No', consent: 'Yes' },
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
    message: GENERIC_SAVE_ERROR,
    type: 'error',
  });
  expect(store.getSnapshot()?.storedValues).toEqual(before?.storedValues);
  expect(screen.getByTestId('submit-referral-btn')).toBeEnabled();
});

it.each<{ response: ApolloLink.Result<CreateReferralMutation> }>([
  { response: {} },
  { response: { data: null } },
  {
    response: {
      data: {
        __typename: 'Mutation',
        createReferral: {
          __typename: 'ReferralType',
          id: '',
        },
      },
    },
  },
])(
  'does not consume the draft without confirmation of a created referral: %j',
  async ({ response }) => {
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
        message:
          'Could not confirm whether the referral was saved. Check the referral list before trying again.',
        type: 'error',
      });
      expect(store.getSnapshot()?.storedValues).toEqual(before?.storedValues);
      expect(close).not.toHaveBeenCalled();
      expect(refreshed).not.toHaveBeenCalled();
      expect(screen.queryByTestId('submit-referral-btn')).toBeNull();
      expect(store.getSnapshot()?.submission.status).toBe('uncertain');
    } finally {
      logged.mockRestore();
    }
  },
);

it('returns to intake and back without losing answers or shelter selection', async () => {
  const { store } = await setup();
  await openPicker();
  await fireEvent.press(screen.getByTestId('picker-back-btn'));
  expect(screen.getByLabelText('Staff Observations / Notes')).toHaveProp(
    'value',
    answers.notes,
  );
  await fireEvent.changeText(
    screen.getByLabelText('Requested arrival date'),
    '2026-09-12',
  );
  await fireEvent.press(screen.getByTestId('intake-next-btn'));
  expect(await screen.findByText('✓ Selected: Alpha House')).toBeOnTheScreen();
  expect(store.getSnapshot()?.answers.requestedArrivalDate).toBe('2026-09-12');
});

it('keeps the pending operation locked through pause/resume and closes the resumed form on success', async () => {
  const { store, requests, close } = await setup();
  await openPicker();
  const request = await submit(requests);
  await fireEvent.press(screen.getByTestId('picker-pause-btn'));
  expect(screen.queryByTestId('shelter-picker-screen')).toBeNull();
  await fireEvent.press(screen.getByTestId('resume-referral-btn'));
  expect(await screen.findByTestId('submit-referral-btn')).toBeDisabled();
  await fireEvent.press(screen.getByTestId('submit-referral-btn'));
  expect(requests).toHaveLength(1);
  await act(async () => request.succeed({ data: created }));
  await waitFor(() => expect(store.getSnapshot()).toBeNull());
  expect(screen.queryByTestId('shelter-picker-screen')).toBeNull();
  expect(close).toHaveBeenCalledTimes(2);
});

it('revalidates on resume, preserves intake when the selected shelter disappears, and submits only its replacement', async () => {
  const { store, requests, loadShelters, setAvailableShelters } = await setup();
  await openPicker();
  const before = store.getSnapshot();
  await fireEvent.press(screen.getByTestId('picker-pause-btn'));
  setAvailableShelters([{ ...shelter, id: 's-2', name: 'Beta House' }]);
  await fireEvent.press(screen.getByTestId('resume-referral-btn'));
  expect(screen.getByTestId('submit-referral-btn')).toBeDisabled();
  await screen.findByText(/^Your saved shelter selection/);
  expect(loadShelters).toHaveBeenCalledTimes(2);
  expect(store.getSnapshot()).toBe(before);
  await fireEvent.press(screen.getByTestId('submit-referral-btn'));
  expect(requests).toHaveLength(0);
  await fireEvent.press(screen.getByRole('radio'));
  const request = await submit(requests);
  expect(request.variables).toEqual({
    data: { clientProfile: 'client-1', shelter: 's-2', notes },
  });
  expect(store.getSnapshot()?.storedValues).toEqual(before?.storedValues);
});

it('does not close another modal when a paused request completes', async () => {
  const { requests, close, store } = await setup();
  await openPicker();
  const request = await submit(requests);
  await fireEvent.press(screen.getByTestId('picker-pause-btn'));
  await fireEvent.press(screen.getByTestId('open-other-modal'));
  await act(async () => request.succeed({ data: created }));
  expect(screen.getByText('Another screen')).toBeOnTheScreen();
  expect(close).toHaveBeenCalledOnce();
  expect(store.getSnapshot()).toBeNull();
});

it('copies a saved referral into an independent draft, resets consent/notes/shelter and submits a reviewed arrival date', async () => {
  const original = {
    ...newReferral,
    notes: buildReferralNotes({
      ...answers,
      requestedArrivalDate: '2026-09-10',
      pets: ['CATS'],
    }),
  };
  const { store, requests } = await setup([original]);
  await fireEvent.press(
    await screen.findByTestId('reuse-referral-new-referral'),
  );
  expect(screen.getByTestId('referral-reuse-review')).toBeOnTheScreen();
  expect(store.getSnapshot()?.selectedShelterId).toBeNull();
  expect(store.getSnapshot()?.answers).toMatchObject({
    substances: answers.substances,
    selfcare: 'No',
    pets: ['CATS'],
    requestedArrivalDate: '2026-09-10',
  });
  expect(store.getSnapshot()?.answers.consent).toBeUndefined();
  expect(screen.getByLabelText('Staff Observations / Notes')).toHaveProp(
    'value',
    '',
  );
  await fireEvent.changeText(
    screen.getByLabelText('Requested arrival date'),
    '2026-09-12',
  );
  await fireEvent.press(screen.getByTestId('consent-yes-btn'));
  await fireEvent.press(screen.getByTestId('intake-next-btn'));
  await fireEvent.press((await screen.findAllByRole('radio'))[0]);
  const request = await submit(requests);
  expect(request.operationName).toBe('CreateReferral');
  expect(decodeReferralNotes(request.variables.data.notes)).toMatchObject({
    humanNotes: '',
    intake: { requestedArrivalDate: '2026-09-12', consent: 'Yes' },
  });
  expect(decodeReferralNotes(original.notes)).toMatchObject({
    humanNotes: answers.notes,
    intake: { requestedArrivalDate: '2026-09-10' },
  });
  await act(async () => request.succeed({ data: created }));
});

it('saves edits through UpdateReferral with only the existing ID and notes, keeping client, shelter and creation date out of the update', async () => {
  const { requests, store } = await setup([newReferral]);
  await fireEvent.press(
    await screen.findByTestId('edit-referral-new-referral'),
  );
  expect(screen.getByText('Save changes')).toBeOnTheScreen();
  await fireEvent.changeText(
    screen.getByLabelText('Staff Observations / Notes'),
    'Corrected observation',
  );
  await fireEvent.changeText(
    screen.getByLabelText('Requested arrival date'),
    '2026-09-12',
  );
  await fireEvent.press(screen.getByTestId('intake-next-btn'));
  await waitFor(() => expect(requests).toHaveLength(1));
  const request = requests[0];
  expect(request.operationName).toBe('UpdateReferral');
  expect(Object.keys(request.variables.data).sort()).toEqual(['id', 'notes']);
  expect(request.variables.data.id).toBe('new-referral');
  expect(decodeReferralNotes(request.variables.data.notes)).toMatchObject({
    humanNotes: 'Corrected observation',
    intake: { requestedArrivalDate: '2026-09-12' },
  });
  expect(newReferral.notes).toBe(notes);
  await act(async () =>
    request.succeed({
      data: {
        __typename: 'Mutation',
        updateReferral: {
          __typename: 'ReferralType',
          id: 'new-referral',
          status: ReferralStatusEnum.Pending,
          notes: request.variables.data.notes,
        },
      },
    }),
  );
  expect(store.getSnapshot()).toBeNull();
  expect(showSnackbar).toHaveBeenLastCalledWith({
    message: 'Referral updated successfully!',
    type: 'success',
  });
});

it('loads older referral pages and keeps those records available for reuse', async () => {
  const recent = Array.from({ length: 25 }, (_, i) => ({
    ...newReferral,
    id: `recent-${i}`,
  }));
  const oldest = { ...newReferral, id: 'older-referral' };
  await setup(recent, [oldest]);
  await fireEvent.press(await screen.findByTestId('infinite-list-load-more'));
  expect(
    await screen.findByTestId('referral-card-older-referral'),
  ).toBeOnTheScreen();
  expect(screen.getByText('Displaying 26 of 26 referrals')).toBeOnTheScreen();
  expect(screen.queryByTestId('infinite-list-load-more')).toBeNull();
  await fireEvent.press(screen.getByTestId('reuse-referral-older-referral'));
  expect(screen.getByTestId('referral-reuse-review')).toBeOnTheScreen();
});

it('retains an edit draft on a permission rejection and retries the update without creating a new referral', async () => {
  const { requests, store } = await setup([newReferral]);
  await fireEvent.press(
    await screen.findByTestId('edit-referral-new-referral'),
  );
  await fireEvent.changeText(
    screen.getByLabelText('Staff Observations / Notes'),
    'Updated observation',
  );
  await fireEvent.press(screen.getByTestId('intake-next-btn'));
  await waitFor(() => expect(requests).toHaveLength(1));
  await act(async () =>
    requests[0].succeed({
      data: {
        __typename: 'Mutation',
        updateReferral: {
          __typename: 'OperationInfo',
          messages: [
            {
              __typename: 'OperationMessage',
              kind: OperationMessageKind.Permission,
              message: 'Permission denied',
            },
          ],
        },
      },
    }),
  );
  expect(store.getSnapshot()?.answers.notes).toBe('Updated observation');
  expect(newReferral.notes).toBe(notes);
  await fireEvent.press(screen.getByTestId('intake-next-btn'));
  await waitFor(() => expect(requests).toHaveLength(2));
  expect(requests.map(({ operationName }) => operationName)).toEqual([
    'UpdateReferral',
    'UpdateReferral',
  ]);
  expect(requests[1].variables).toEqual(requests[0].variables);
  await act(async () =>
    requests[1].succeed({
      data: {
        __typename: 'Mutation',
        updateReferral: {
          __typename: 'ReferralType',
          id: 'new-referral',
          status: ReferralStatusEnum.Pending,
          notes: requests[1].variables.data.notes,
        },
      },
    }),
  );
  expect(store.getSnapshot()).toBeNull();
});

// These component fixtures use production-shaped IDs and the corresponding directory.
vi.mock('@monorepo/ba-platform', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@monorepo/ba-platform')>()),
  useApiConfig: () => ({ apiUrl: 'https://api.prod.betterangels.la' }),
}));

it('ignores a submission response after its account session has been released', async () => {
  const { store, requests, refreshed } = await setup();
  await openPicker();
  const request = await submit(requests);
  await act(() => store.release());
  await act(async () => request.succeed({ data: created }));
  expect(showSnackbar).not.toHaveBeenCalled();
  expect(refreshed).not.toHaveBeenCalled();
  expect(store.startNew('client-1')).toBe(false);
});
