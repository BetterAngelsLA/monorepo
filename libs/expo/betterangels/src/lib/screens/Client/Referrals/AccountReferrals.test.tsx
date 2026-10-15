import { ApolloLink } from '@apollo/client';
import { createApolloCache } from '@monorepo/apollo';
import { createBaTypePolicies } from '../../../apollo/cachePolicies';
import { MockedProvider } from '@apollo/client/testing/react';
import {
  ApiConfigProvider,
  configureActiveOrgStorage,
  useActiveOrg,
} from '@monorepo/ba-platform';
import { ReferralStatusEnum } from '@monorepo/ba-platform/types';
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react-native';
import { useState } from 'react';
import { Alert } from 'react-native';
import { Observable } from 'rxjs';
import { icons, svg, uiComponents } from '../../../../__mocks__/sharedBarrels';
import UserProvider, { useUser } from '../../../providers/user/UserProvider';
import { ModalScreenContext } from '../../../providers/modalScreen/ModalScreenContext';
import type { TShowModalScreenProps } from '../../../providers/modalScreen/types';
import type { ClientProfileQuery } from '../__generated__/Client.generated';
import { ReferralsTab } from './ReferralsTab';
import {
  getPersistentReferralDraft,
  releaseReferralDraftSession,
} from './referralDraftStorage';
import { buildReferralNotes } from './referralIntakeSidecar';

const { backing, fault, showSnackbar } = vi.hoisted(() => ({
  backing: new Map<string, Map<string, string>>(),
  fault: { operation: '', storage: 'referral-drafts-v2' },
  showSnackbar: vi.fn(),
}));
vi.mock('react-native-mmkv', () => ({
  MMKV: vi.fn(),
  createMMKV: ({ id }: { id: string }) => {
    if (fault.operation === 'open' && fault.storage === id)
      throw new Error('Synthetic storage open failure');
    if (!backing.has(id)) backing.set(id, new Map());
    const data = backing.get(id);
    if (!data) throw new Error('Expected initialized test storage');
    function check(operation: string) {
      if (fault.operation === operation && fault.storage === id)
        throw new Error('Synthetic storage failure');
    }
    return {
      getString: (key: string) => {
        check('read');
        return data.get(key);
      },
      set: (key: string, value: string) => {
        check('write');
        data.set(key, value);
      },
      remove: (key: string) => {
        check('remove');
        data.delete(key);
      },
      getAllKeys: () => [...data.keys()],
    };
  },
}));
vi.mock('expo-crypto', async () => ({
  randomUUID: (await import('node:crypto')).randomUUID,
}));
vi.mock('@monorepo/expo/shared/ui-components', () => uiComponents());
vi.mock('@monorepo/expo/shared/icons', () => icons());
vi.mock('react-native-svg', () => svg());
vi.mock('expo-web-browser', () => ({ openBrowserAsync: vi.fn() }));
vi.mock('expo-router', () => ({ useRouter: () => ({ navigate: vi.fn() }) }));
vi.mock(
  '../../../providers',
  async () => import('../../../providers/modalScreen/useModalScreen'),
);
vi.mock('../../../hooks', () => ({ useSnackbar: () => ({ showSnackbar }) }));
vi.mock('@monorepo/expo/shared/clients', () => ({
  API_ERROR_CODES: { UNAUTHENTICATED: 'UNAUTHENTICATED' },
}));

const scope = {
  apiUrl: 'https://referral-test.invalid',
  userId: 'user-1',
  organizationId: 'org-1',
  clientId: 'client-1',
};
const key = JSON.stringify(Object.values(scope));
const client: ClientProfileQuery = {
  __typename: 'Query',
  clientProfile: {
    __typename: 'ClientProfileType',
    id: scope.clientId,
    firstName: 'Fictional',
    displayCaseManager: '',
  },
};
const user = {
  __typename: 'UserType' as const,
  id: scope.userId,
  username: 'Tester',
  firstName: 'Test',
  lastName: 'User',
  email: null,
  organizations: ['org-1', 'org-2'].map((id) => ({
    __typename: 'OrganizationType' as const,
    id,
    name: id,
    permissions: [],
  })),
  isOutreachAuthorized: true,
  hasAcceptedTos: true,
  hasAcceptedPrivacyPolicy: true,
  isHmisUser: false,
};
const shelter = {
  __typename: 'ShelterType',
  id: 's-1',
  name: 'Fictional House',
  location: null,
  pets: [],
  demographics: [],
  accessibility: [],
};
const referral = {
  __typename: 'ReferralType',
  id: 'saved-1',
  status: ReferralStatusEnum.Pending,
  createdAt: '2026-09-08T12:00:00Z',
  shelter,
  createdBy: null,
  notes: buildReferralNotes({ notes: 'Saved referral notes' }),
};

function seedDraft(status = 'idle') {
  const value = {
    version: 1,
    id: 'draft-1',
    clientId: scope.clientId,
    step: 'intake',
    fields: { notes: 'Retained local notes' },
    pii: {},
    selectedShelterId: null,
    updatedAt: 1,
    submission:
      status === 'idle' ? { status } : { status, attemptId: 'attempt-1' },
  };
  backing.set('referral-drafts-v2', new Map([[key, JSON.stringify(value)]]));
  return value;
}

async function setup(
  options: { history?: boolean; noOrganizations?: boolean } = {},
) {
  const requests: {
    succeed: (result: ApolloLink.Result) => void;
    fail: () => void;
  }[] = [];
  const queries = vi.fn();
  let saved = options.history ?? false;
  const link = new ApolloLink(
    (operation) =>
      new Observable((observer) => {
        if (operation.operationName === 'CreateReferral') {
          requests.push({
            succeed: (result) => {
              saved = true;
              observer.next(result);
              observer.complete();
            },
            fail: () => observer.error(new Error('Synthetic lost response')),
          });
          return;
        }
        queries(operation.operationName);
        const data =
          operation.operationName === 'currentUser'
            ? {
                currentUser: {
                  ...user,
                  organizations: options.noOrganizations
                    ? []
                    : user.organizations,
                },
              }
            : operation.operationName === 'Shelters'
              ? {
                  shelters: {
                    __typename: 'ShelterTypeOffsetPaginated',
                    totalCount: 1,
                    results: [shelter],
                  },
                }
              : {
                  referrals: {
                    __typename: 'ReferralTypeOffsetPaginated',
                    totalCount: saved ? 1 : 0,
                    results: saved ? [referral] : [],
                  },
                };
        observer.next({ data });
        observer.complete();
      }),
  );
  let account!: ReturnType<typeof useUser>;
  let organization!: ReturnType<typeof useActiveOrg>;
  let changeApi!: (url: string) => void;
  let changeClient!: (id: string) => void;
  function Content() {
    account = useUser();
    organization = useActiveOrg();
    const [modal, setModal] = useState<TShowModalScreenProps | null>(null);
    const [clientId, setClientId] = useState(scope.clientId);
    changeClient = setClientId;
    return (
      <ModalScreenContext.Provider
        value={{
          showModalScreen: setModal,
          content: null,
          presentation: 'fullScreenModal',
        }}
      >
        <ReferralsTab
          client={{
            ...client,
            clientProfile: { ...client.clientProfile, id: clientId },
          }}
        />
        {modal?.renderContent({
          close: () => {
            modal.onClose?.();
            setModal(null);
          },
        })}
      </ModalScreenContext.Provider>
    );
  }
  function Harness() {
    const [apiUrl, setApiUrl] = useState(scope.apiUrl);
    changeApi = setApiUrl;
    return (
      <ApiConfigProvider
        apiUrl={apiUrl}
        buildFetch={() => async () => {
          throw new Error('Unexpected fetch');
        }}
      >
        <MockedProvider
          link={link}
          cache={createApolloCache({
            typePolicies: createBaTypePolicies(false),
          })}
        >
          <UserProvider>
            <Content />
          </UserProvider>
        </MockedProvider>
      </ApiConfigProvider>
    );
  }
  const view = await render(<Harness />);
  return {
    ...view,
    requests,
    queries,
    account: () => account,
    organization: () => organization,
    changeApi: (url: string) => changeApi(url),
    changeClient: (id: string) => changeClient(id),
  };
}

async function alertButton(text: string) {
  const modalAction =
    text === 'Cancel'
      ? 'discard-modal-cancel'
      : text === 'Discard'
        ? 'discard-modal-confirm'
        : null;
  if (modalAction && screen.queryByTestId(modalAction)) {
    await fireEvent.press(screen.getByTestId(modalAction));
    return;
  }
  const buttons = vi.mocked(Alert.alert).mock.lastCall?.[2];
  const button = buttons?.find((b) => b.text === text);
  expect(button, `Expected alert button ${text}`).toBeDefined();
  await act(() => button?.onPress?.());
}
function expectWriteFailure() {
  expect(showSnackbar).toHaveBeenLastCalledWith(
    expect.objectContaining({
      message: expect.stringContaining('last saved draft is unchanged'),
      type: 'error',
    }),
  );
}
async function openPicker() {
  await screen.findByTestId('create-referral-btn');
  await fireEvent.press(screen.getByTestId('create-referral-btn'));
  await fireEvent.changeText(
    screen.getByLabelText('Staff Observations / Notes'),
    'Local observations',
  );
  await fireEvent.press(screen.getByTestId('intake-next-btn'));
  await screen.findByText('Fictional House');
  await fireEvent.press(screen.getByRole('radio'));
}

beforeEach(() => {
  let activeOrgId: string | null = null;
  configureActiveOrgStorage({
    get: () => activeOrgId,
    set: (id) => {
      activeOrgId = id;
    },
  });
  backing.clear();
  fault.operation = '';
  fault.storage = 'referral-drafts-v2';
  showSnackbar.mockClear();
  vi.spyOn(Alert, 'alert').mockImplementation(() => undefined);
});
afterEach(async () => {
  await cleanup();
  await act(async () => undefined);
  // The real UserProvider releases the active session. Also remove stores for
  // deliberately unmounted identities used by boundary tests.
  for (const apiUrl of [scope.apiUrl, 'https://other.invalid'])
    for (const userId of ['user-1', 'user-2'])
      for (const organizationId of ['org-1', 'org-2'])
        releaseReferralDraftSession({ apiUrl, userId, organizationId });
  vi.restoreAllMocks();
});

it('waits for an account organization instead of creating an unscoped draft', async () => {
  await setup({ noOrganizations: true });
  await screen.findByTestId('authorized-root');
  expect(screen.queryByTestId('create-referral-btn')).toBeNull();
  expect(backing.get('referral-drafts-v2')?.size ?? 0).toBe(0);
});

it('restores the account draft, pauses/resumes, and discards only after confirmation', async () => {
  seedDraft();
  await setup();
  await fireEvent.press(await screen.findByTestId('resume-referral-btn'));
  expect(
    screen.getByLabelText('Staff Observations / Notes'),
  ).toHaveDisplayValue('Retained local notes');
  await fireEvent.press(screen.getByTestId('intake-pause-btn'));
  await fireEvent.press(screen.getByTestId('draft-discard-btn'));
  await alertButton('Cancel');
  expect(backing.get('referral-drafts-v2')?.has(key)).toBe(true);
  await fireEvent.press(screen.getByTestId('referral-draft-card'));
  expect(screen.getByTestId('referral-intake-screen')).toBeOnTheScreen();
  await fireEvent.press(screen.getByTestId('intake-pause-btn'));
  await fireEvent.press(screen.getByTestId('draft-discard-btn'));
  await alertButton('Discard');
  expect(screen.queryByTestId('referral-draft-card')).toBeNull();
  expect(screen.getByTestId('create-referral-btn')).toBeOnTheScreen();
  expect(backing.get('referral-drafts-v2')?.has(key)).toBe(false);
});

it.each(['organization', 'account', 'environment', 'logout'] as const)(
  'revokes an open form on %s change and restores retained answers on return',
  async (boundary) => {
    seedDraft();
    const app = await setup();
    await fireEvent.press(await screen.findByTestId('resume-referral-btn'));
    const old = getPersistentReferralDraft(scope);
    await act(() => {
      if (boundary === 'organization')
        app.organization().setActiveOrgId('org-2');
      if (boundary === 'account')
        app.account().setUser({ ...user, id: 'user-2' });
      if (boundary === 'environment') app.changeApi('https://other.invalid');
      if (boundary === 'logout') app.account().setUser(undefined);
    });
    await waitFor(() =>
      expect(screen.queryByTestId('referral-intake-screen')).toBeNull(),
    );
    expect(old.startNew(scope.clientId)).toBe(false);
    expect(backing.get('referral-drafts-v2')?.get(key)).toContain(
      'Retained local notes',
    );
    await act(() => {
      app.changeApi(scope.apiUrl);
      app.account().setUser(user);
    });
    await act(() => app.organization().setActiveOrgId('org-1'));
    await fireEvent.press(await screen.findByTestId('resume-referral-btn'));
    expect(
      screen.getByLabelText('Staff Observations / Notes'),
    ).toHaveDisplayValue('Retained local notes');
  },
);

it('keeps different clients separate in the account-backed screen', async () => {
  seedDraft();
  const app = await setup();
  await screen.findByTestId('resume-referral-btn');
  await act(() => app.changeClient('client-2'));
  await fireEvent.press(await screen.findByTestId('create-referral-btn'));
  await fireEvent.changeText(
    screen.getByLabelText('Staff Observations / Notes'),
    'Second client',
  );
  await fireEvent.press(screen.getByTestId('intake-pause-btn'));
  await act(() => app.changeClient('client-1'));
  await fireEvent.press(await screen.findByTestId('resume-referral-btn'));
  expect(
    screen.getByLabelText('Staff Observations / Notes'),
  ).toHaveDisplayValue('Retained local notes');
});

it.each(['read', 'open'])(
  'recovers a transient storage %s failure through the screen without overwriting data',
  async (operation) => {
    seedDraft();
    fault.operation = operation;
    await setup();
    await screen.findByText('Local draft needs attention');
    expect(screen.queryByTestId('create-referral-btn')).toBeNull();
    await fireEvent.press(screen.getByText('Retry reading draft'));
    expect(screen.getByText('Local draft needs attention')).toBeOnTheScreen();
    fault.operation = '';
    await fireEvent.press(screen.getByText('Retry reading draft'));
    await fireEvent.press(screen.getByTestId('resume-referral-btn'));
    expect(
      screen.getByLabelText('Staff Observations / Notes'),
    ).toHaveDisplayValue('Retained local notes');
  },
);

it('protects unreadable data from create/edit/reuse and keeps the warning until removal succeeds', async () => {
  backing.set('referral-drafts-v2', new Map([[key, '{invalid']]));
  await setup({ history: true });
  await screen.findByText('Local draft needs attention');
  expect(screen.queryByTestId('create-referral-btn')).toBeNull();
  await fireEvent.press(await screen.findByTestId('edit-referral-saved-1'));
  expect(screen.queryByTestId('referral-intake-screen')).toBeNull();
  await fireEvent.press(screen.getByText('Discard unreadable draft'));
  await alertButton('Cancel');
  expect(backing.get('referral-drafts-v2')?.get(key)).toBe('{invalid');
  fault.operation = 'remove';
  await fireEvent.press(screen.getByText('Discard unreadable draft'));
  await alertButton('Discard');
  expect(
    screen.getByText('The draft could not be removed. Please try again.'),
  ).toBeOnTheScreen();
  fault.operation = '';
  await fireEvent.press(screen.getByText('Discard unreadable draft'));
  await alertButton('Discard');
  expect(screen.getByTestId('create-referral-btn')).toBeOnTheScreen();
  expect(screen.getByTestId('referral-card-saved-1')).toBeOnTheScreen();
});

it.each(['none', 'write', 'legacy-remove'])(
  'recovers an older draft explicitly and safely handles %s failure',
  async (failure) => {
    const value = seedDraft();
    backing.delete('referral-drafts-v2');
    backing.set('referral-draft', new Map([['draft', JSON.stringify(value)]]));
    await setup();
    await fireEvent.press(await screen.findByText('Recover older local draft'));
    await alertButton('Cancel');
    expect(backing.get('referral-drafts-v2')?.size).toBe(0);
    if (failure === 'write') fault.operation = 'write';
    if (failure === 'legacy-remove') {
      fault.operation = 'remove';
      fault.storage = 'referral-draft';
    }
    await fireEvent.press(screen.getByText('Recover older local draft'));
    await alertButton('Recover');
    if (failure !== 'none') {
      expect(showSnackbar).toHaveBeenLastCalledWith(
        expect.objectContaining({ type: 'error' }),
      );
      expect(backing.get('referral-draft')?.has('draft')).toBe(true);
    }
    if (failure === 'write') {
      expect(screen.queryByTestId('resume-referral-btn')).toBeNull();
      fault.operation = '';
      await fireEvent.press(screen.getByText('Recover older local draft'));
      await alertButton('Recover');
    }
    expect(screen.queryByText('Recover older local draft')).toBeNull();
    await fireEvent.press(screen.getByTestId('resume-referral-btn'));
    expect(
      screen.getByLabelText('Staff Observations / Notes'),
    ).toHaveDisplayValue('Retained local notes');
  },
);

it('reports failed draft creation and retries without opening an unsaved form', async () => {
  await setup();
  await screen.findByTestId('create-referral-btn');
  fault.operation = 'write';
  await fireEvent.press(screen.getByTestId('create-referral-btn'));
  expectWriteFailure();
  expect(screen.queryByTestId('referral-intake-screen')).toBeNull();
  fault.operation = '';
  await fireEvent.press(screen.getByTestId('create-referral-btn'));
  expect(screen.getByTestId('referral-intake-screen')).toBeOnTheScreen();
});

it('retains saved answers and the current step when field or navigation writes fail', async () => {
  seedDraft();
  await setup();
  await fireEvent.press(await screen.findByTestId('resume-referral-btn'));
  fault.operation = 'write';
  await fireEvent.changeText(
    screen.getByLabelText('Staff Observations / Notes'),
    'Unsaved edit',
  );
  expectWriteFailure();
  expect(
    screen.getByLabelText('Staff Observations / Notes'),
  ).toHaveDisplayValue('Retained local notes');
  await fireEvent.press(screen.getByTestId('intake-next-btn'));
  expectWriteFailure();
  expect(screen.getByTestId('referral-intake-screen')).toBeOnTheScreen();
  fault.operation = '';
  await fireEvent.press(screen.getByTestId('intake-next-btn'));
  await screen.findByText('Fictional House');
  fault.operation = 'write';
  await fireEvent.press(screen.getByRole('radio'));
  expectWriteFailure();
  expect(screen.getByTestId('submit-referral-btn')).toBeDisabled();
  await fireEvent.press(screen.getByTestId('picker-back-btn'));
  expectWriteFailure();
  expect(screen.getByTestId('shelter-picker-screen')).toBeOnTheScreen();
});

it('keeps the draft available when list discard or in-form cancel cannot delete it', async () => {
  seedDraft();
  await setup();
  await screen.findByTestId('resume-referral-btn');
  fault.operation = 'remove';
  await fireEvent.press(screen.getByTestId('draft-discard-btn'));
  await alertButton('Discard');
  expectWriteFailure();
  await fireEvent.press(screen.getByTestId('resume-referral-btn'));
  await fireEvent.press(screen.getByTestId('intake-cancel-btn'));
  await fireEvent.press(screen.getByTestId('discard-modal-confirm'));
  expectWriteFailure();
  expect(screen.getByTestId('referral-intake-screen')).toBeOnTheScreen();
  fault.operation = '';
  await fireEvent.press(screen.getByTestId('intake-cancel-btn'));
  await fireEvent.press(screen.getByTestId('discard-modal-confirm'));
  expect(screen.queryByTestId('referral-intake-screen')).toBeNull();
  expect(backing.get('referral-drafts-v2')?.has(key)).toBe(false);
});

it('preserves the original draft if replacing it from a saved referral fails', async () => {
  seedDraft();
  await setup({ history: true });
  await fireEvent.press(await screen.findByTestId('edit-referral-saved-1'));
  fault.operation = 'write';
  await alertButton('Discard and start');
  expectWriteFailure();
  expect(backing.get('referral-drafts-v2')?.get(key)).toContain(
    'Retained local notes',
  );
  expect(screen.queryByTestId('referral-intake-screen')).toBeNull();
  fault.operation = '';
  await fireEvent.press(screen.getByTestId('edit-referral-saved-1'));
  await alertButton('Discard and start');
  expect(
    screen.getByLabelText('Staff Observations / Notes'),
  ).toHaveDisplayValue('Saved referral notes');
});

it('sends nothing when the pending submission cannot be stored', async () => {
  const app = await setup();
  await openPicker();
  fault.operation = 'write';
  await fireEvent.press(screen.getByTestId('submit-referral-btn'));
  await waitFor(() =>
    expect(showSnackbar).toHaveBeenLastCalledWith(
      expect.objectContaining({
        message: expect.stringContaining('Nothing was sent'),
      }),
    ),
  );
  expect(app.requests).toHaveLength(0);
  expect(screen.getByTestId('submit-referral-btn')).toBeEnabled();
  fault.operation = '';
  await fireEvent.press(screen.getByTestId('submit-referral-btn'));
  await waitFor(() => expect(app.requests).toHaveLength(1));
});

it('disables discard while pending and requires a check before discarding an uncertain submission', async () => {
  const app = await setup();
  await openPicker();
  await fireEvent.press(screen.getByTestId('submit-referral-btn'));
  await waitFor(() => expect(app.requests).toHaveLength(1));
  await fireEvent.press(screen.getByTestId('picker-pause-btn'));
  expect(screen.getByTestId('draft-discard-btn')).toBeDisabled();
  await fireEvent.press(screen.getByTestId('draft-discard-btn'));
  expect(Alert.alert).not.toHaveBeenCalled();
  await act(async () => app.requests[0].fail());
  await fireEvent.press(screen.getByTestId('draft-discard-btn'));
  expect(
    screen.getByText(/A saved referral may already exist/),
  ).toBeOnTheScreen();
  await alertButton('Cancel');
  expect(backing.get('referral-drafts-v2')?.has(key)).toBe(true);
  await fireEvent.press(screen.getByTestId('draft-discard-btn'));
  await alertButton('Discard');
  expect(screen.getByTestId('create-referral-btn')).toBeOnTheScreen();
  expect(app.requests).toHaveLength(1);
});

it('shows a terminal saved state when server success cannot clear local storage', async () => {
  const app = await setup();
  await openPicker();
  await fireEvent.press(screen.getByTestId('submit-referral-btn'));
  await waitFor(() => expect(app.requests).toHaveLength(1));
  fault.operation = 'remove';
  await act(async () =>
    app.requests[0].succeed({ data: { createReferral: referral } }),
  );
  expect(screen.getByText('Clear saved draft')).toBeOnTheScreen();
  expect(screen.queryByTestId('submit-referral-btn')).toBeNull();
  expect(screen.getByTestId('referral-card-saved-1')).toBeOnTheScreen();
  await fireEvent.press(screen.getByText('Clear saved draft'));
  expectWriteFailure();
  fault.operation = '';
  await fireEvent.press(screen.getByText('Clear saved draft'));
  expect(screen.queryByTestId('referral-draft-card')).toBeNull();
  expect(app.requests).toHaveLength(1);
});

it.each(['lost response', 'rejection'])(
  'recovers from a failed result write after %s without getting stuck pending or retrying automatically',
  async (outcome) => {
    const app = await setup();
    await openPicker();
    await fireEvent.press(screen.getByTestId('submit-referral-btn'));
    await waitFor(() => expect(app.requests).toHaveLength(1));
    fault.operation = 'write';
    await act(async () => {
      if (outcome === 'lost response') app.requests[0].fail();
      else
        app.requests[0].succeed({
          data: {
            createReferral: { __typename: 'OperationInfo', messages: [] },
          },
        });
    });
    expect(screen.getByTestId('referral-uncertain-screen')).toBeOnTheScreen();
    await fireEvent.press(screen.getByTestId('confirm-referral-retry-btn'));
    expectWriteFailure();
    expect(screen.getByTestId('referral-uncertain-screen')).toBeOnTheScreen();
    expect(app.requests).toHaveLength(1);
    fault.operation = '';
    await fireEvent.press(screen.getByTestId('confirm-referral-retry-btn'));
    await screen.findByTestId('submit-referral-btn');
    expect(app.requests).toHaveLength(1);
  },
);

it('ignores an older recovery confirmation after the account has changed', async () => {
  const value = seedDraft();
  backing.delete('referral-drafts-v2');
  backing.set('referral-draft', new Map([['draft', JSON.stringify(value)]]));
  const app = await setup();
  await fireEvent.press(await screen.findByText('Recover older local draft'));
  await act(() => app.account().setUser({ ...user, id: 'user-2' }));
  await alertButton('Recover');
  expect(backing.get('referral-drafts-v2')?.size).toBe(0);
  expect(backing.get('referral-draft')?.has('draft')).toBe(true);
  expect(screen.queryByTestId('resume-referral-btn')).toBeNull();
});
