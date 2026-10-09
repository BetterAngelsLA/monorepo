import {
  ApolloClient,
  ApolloLink,
  InMemoryCache,
  Observable,
} from '@apollo/client';
import { ApolloProvider } from '@apollo/client/react';
import { configureActiveOrgStorage } from '@monorepo/ba-platform';
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react-native';
import { ReactNode, useEffect, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import SnackbarProvider from '../providers/snackbar/SnackbarProvider';
import UserProvider, { useUser } from '../providers/user/UserProvider';
import ConsentModal from './ConsentModal';

// `Link` renders its children inside a `Text`, as expo-router does. The mock has
// to match: returning the raw string puts text straight inside a View, which the
// renderer now rejects with "Text strings must be rendered within a <Text>
// component" (it used to be only a warning).
vi.mock('expo-router', async () => {
  const { Text: RNText } = await import('react-native');

  return {
    Link: ({ children }: { children: ReactNode }) => (
      <RNText>{children}</RNText>
    ),
    useRouter: () => ({ back: vi.fn(), navigate: vi.fn(), replace: vi.fn() }),
  };
});

// The real design-system barrel re-exports native-backed components (camera,
// clipboard, PDF viewer) whose import chains cannot load under vitest-native.
// Stub the barrel to the pieces ConsentModal renders, as the sibling specs do,
// keeping the pieces the assertions touch: the button titles, the checkbox
// accessibility hints, and the sheet's open/closed visibility.
vi.mock('@monorepo/expo/shared/ui-components', () => ({
  BaseModal: ({
    isOpen,
    children,
  }: {
    isOpen?: boolean;
    children?: ReactNode;
  }) => (isOpen ? <View>{children}</View> : null),
  Button: ({
    title,
    onPress,
    disabled,
  }: {
    title?: string;
    onPress?: () => void;
    disabled?: boolean;
  }) => (
    <Pressable accessibilityRole="button" disabled={disabled} onPress={onPress}>
      <Text>{title}</Text>
    </Pressable>
  ),
  Checkbox: ({
    onCheck,
    accessibilityHint,
    label,
  }: {
    onCheck?: () => void;
    accessibilityHint?: string;
    label?: ReactNode;
  }) => (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityHint={accessibilityHint}
      onPress={onCheck}
    >
      {label}
    </Pressable>
  ),
  ControlledInput: ({ label }: { label?: string }) => <Text>{label}</Text>,
  Form: {
    Page: ({ children }: { children?: ReactNode }) => <View>{children}</View>,
    Fieldset: ({ children }: { children?: ReactNode }) => (
      <View>{children}</View>
    ),
  },
  Snackbar: () => null,
  TextBold: ({ children }: { children?: ReactNode }) => <Text>{children}</Text>,
  TextRegular: ({ children }: { children?: ReactNode }) => (
    <Text>{children}</Text>
  ),
}));

// `../hooks` and `../providers` are barrels that also re-export native-backed
// modules (location, crypto, paper, ...). Stub them to the pieces ConsentModal
// and UserProfileEdit use. `useUser` is the real provider hook rather than a
// stand-in: the ordering these tests pin lives in the shared context, so the
// component's `setUser` must be the same setter the harness reads.
vi.mock('../hooks', async () => {
  const { useUser } = await import('../providers/user/UserProvider');

  return {
    useUser,
    useSignOut: () => ({ signOut: vi.fn() }),
    useSnackbar: () => ({ showSnackbar: vi.fn() }),
  };
});

// Keep the real document: the tests release responses by operation name, which
// Apollo derives from it.
vi.mock('../providers', async () => {
  const { UpdateCurrentUserDocument } = await import(
    '../providers/user/__generated__/mutations.generated'
  );

  return { UpdateCurrentUserDocument };
});

/**
 * The consent sheet is the app's only blocking gate, and what used to break it
 * was ordering: a ``currentUser`` read issued before the accept landed after
 * it, still answering "not accepted", and put the sheet back up. Apollo hands
 * an in-flight read to a later refetch rather than issuing a fresh one, so
 * re-reading after the write is not enough on its own.
 *
 * These tests hold reads open at the link, so the ordering is decided by the
 * code rather than by whichever response happens to win a real network race.
 */

const BASE_USER = {
  __typename: 'CurrentUserType',
  id: 'user-1',
  username: 'coop',
  firstName: 'Dale',
  lastName: 'Cooper',
  email: 'coop@example.co',
  organizations: [
    {
      __typename: 'CurrentUserOrganizationType',
      id: 'org-1',
      name: "Twin Peaks Sheriff's Department",
      permissions: [],
    },
  ],
  isOutreachAuthorized: true,
  hasAcceptedTos: false,
  hasAcceptedPrivacyPolicy: false,
  isHmisUser: false,
};

const currentUser = (overrides: Partial<typeof BASE_USER> = {}) => ({
  currentUser: { ...BASE_USER, ...overrides },
});

const ACCEPT_RECORDED = {
  updateCurrentUser: { __typename: 'UserType', id: 'user-1' },
};

/** A link that parks every request until the test releases it by hand. */
function createControlledClient() {
  const pending: {
    operationName: string | undefined;
    send: (data: unknown) => void;
  }[] = [];

  const link = new ApolloLink(
    (operation) =>
      new Observable((observer) => {
        pending.push({
          operationName: operation.operationName,
          send: (data) => {
            observer.next({ data } as never);
            observer.complete();
          },
        });
      }),
  );

  /** Releases the oldest unreleased request for the named operation. */
  const release = async (operationName: string, data: unknown) => {
    const request = pending.find((p) => p.operationName === operationName);
    if (!request) throw new Error(`no ${operationName} in flight`);
    pending.splice(pending.indexOf(request), 1);
    await act(async () => {
      request.send(data);
    });
  };

  const client = new ApolloClient({
    link,
    cache: new InMemoryCache({
      typePolicies: { UserType: { keyFields: ['id'] } },
    }),
    defaultOptions: { watchQuery: { notifyOnNetworkStatusChange: false } },
  });

  /**
   * Sends a response without awaiting `act`, for use *inside* an open act scope.
   * `release` cannot be used there: awaiting it nests an async act inside the
   * outer one, and a press whose work is never settled keeps that outer scope
   * open past the end of the test.
   */
  const sendNow = (operationName: string, data: unknown) => {
    const request = pending.find((p) => p.operationName === operationName);
    if (!request) throw new Error(`no ${operationName} in flight`);
    pending.splice(pending.indexOf(request), 1);
    request.send(data);
  };

  return { client, release, sendNow, pending };
}

/**
 * Stands in for the tabs layout, which owns both the user read and the sheet's
 * open state: it hands `ConsentModal` the `user` from context and the
 * `isModalVisible`/`closeModal` pair the component's props require, and opens
 * the sheet under the same two conditions the app does. Rendering the modal
 * bare is not possible — `user`, `isModalVisible` and `closeModal` are required
 * props — and a static `user` would hide the very refetch/ordering behaviour
 * these tests exercise.
 */
let refetchUser: (() => Promise<void>) | undefined;
function ConsentGate() {
  const { user, refetchUser: refetch } = useUser();
  const [isModalVisible, setIsModalVisible] = useState(false);

  useEffect(() => {
    refetchUser = refetch;
  }, [refetch]);

  useEffect(() => {
    if (!user) return;

    const needsAgreements =
      user.hasAcceptedTos === false || user.hasAcceptedPrivacyPolicy === false;
    const needsName =
      user.hasAcceptedTos === true &&
      user.hasAcceptedPrivacyPolicy === true &&
      (!user.firstName || !user.lastName);

    if (needsAgreements || needsName) setIsModalVisible(true);
  }, [user]);

  if (!user) return null;

  return (
    <ConsentModal
      user={user}
      isModalVisible={isModalVisible}
      closeModal={() => setIsModalVisible(false)}
      privacyPolicyUrl="https://example.test/legal/privacy-policy"
      termsOfServiceUrl="https://example.test/legal/terms-of-service"
    />
  );
}

async function renderConsentModal() {
  const controls = createControlledClient();

  await render(
    <ApolloProvider client={controls.client}>
      <SafeAreaProvider
        initialMetrics={{
          frame: { x: 0, y: 0, width: 390, height: 844 },
          insets: { top: 47, left: 0, right: 0, bottom: 34 },
        }}
      >
        <SnackbarProvider>
          <UserProvider>
            <ConsentGate />
          </UserProvider>
        </SnackbarProvider>
      </SafeAreaProvider>
    </ApolloProvider>,
  );

  return controls;
}

const consentSheet = () => screen.queryByText('Consent');
const registrationSheet = () =>
  screen.queryByText('Complete Your Registration');

async function acceptAndSubmit(
  controls: ReturnType<typeof createControlledClient>,
  mutationResponse: unknown = ACCEPT_RECORDED,
) {
  await act(async () => {
    await fireEvent.press(screen.getByHintText('Accept the terms of service'));
    await fireEvent.press(screen.getByHintText('Accept the privacy policy'));
  });

  // `Get Started` starts the accept mutation, which the controlled link answers
  // only when told to. Answer it inside the same act scope so the press's
  // promise settles here rather than dangling into the next test.
  const press = fireEvent.press(screen.getByText('Get Started'));
  controls.sendNow('UpdateCurrentUser', mutationResponse);
  await press;
}

describe('ConsentModal', () => {
  beforeEach(() => {
    configureActiveOrgStorage({ get: () => null, set: vi.fn() });
  });

  it('prompts a user who has not accepted', async () => {
    const { release } = await renderConsentModal();

    await release('currentUser', currentUser());

    await waitFor(() => expect(consentSheet()).not.toBeNull());
  });

  it('stays closed when a read that predates the accept lands afterwards', async () => {
    const controls = await renderConsentModal();

    await controls.release('currentUser', currentUser());
    await waitFor(() => expect(consentSheet()).not.toBeNull());

    // Stands in for the refetch the app fires on foreground — on the wire
    // before the accept, so the server answers it without one.
    await act(async () => {
      refetchUser?.();
    });
    expect(
      controls.pending.filter((p) => p.operationName === 'currentUser'),
    ).toHaveLength(1);

    await acceptAndSubmit(controls);

    await controls.release('currentUser', currentUser({ hasAcceptedTos: false }));

    expect(consentSheet()).toBeNull();
    expect(registrationSheet()).toBeNull();
  });

  it('asks for a missing name in place, without re-prompting for consent', async () => {
    const controls = await renderConsentModal();

    await controls.release('currentUser', currentUser({ lastName: undefined }));
    await waitFor(() => expect(consentSheet()).not.toBeNull());

    await acceptAndSubmit(controls);

    // A fresh read lands after the accept (the app refetches on foreground).
    await act(async () => {
      refetchUser?.();
    });
    await controls.release(
      'currentUser',
      currentUser({
        hasAcceptedTos: true,
        hasAcceptedPrivacyPolicy: true,
        lastName: undefined,
      }),
    );

    expect(consentSheet()).toBeNull();
    expect(registrationSheet()).not.toBeNull();
  });

  it('keeps prompting when the server rejects the accept', async () => {
    const controls = await renderConsentModal();

    await controls.release('currentUser', currentUser());
    await waitFor(() => expect(consentSheet()).not.toBeNull());

    await acceptAndSubmit(controls, {
      updateCurrentUser: {
        __typename: 'OperationInfo',
        messages: [
          {
            __typename: 'OperationMessage',
            kind: 'ERROR',
            field: null,
            message: 'nope',
          },
        ],
      },
    });

    expect(consentSheet()).not.toBeNull();
  });
});
