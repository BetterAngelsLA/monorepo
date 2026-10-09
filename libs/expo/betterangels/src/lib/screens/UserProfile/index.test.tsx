import {
  ApolloClient,
  ApolloLink,
  InMemoryCache,
  Observable,
} from '@apollo/client';
import { ApolloProvider } from '@apollo/client/react';
import {
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react-native';
import { cloneElement, ReactElement, ReactNode, useState } from 'react';
import { Pressable, Text } from 'react-native';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import UserProfile from './index';

/**
 * Deleting the account is refused while it still owns an organization.  The
 * mutation reports that as an ``OperationInfo`` payload, which resolves rather
 * than throwing — so a screen that only catches network errors signs the user
 * out of an account that still exists, and says nothing about why.
 */

const { USER, mockNavigate, mockShowSnackbar, mockSignOut } = vi.hoisted(
  () => ({
    USER: {
      id: 'user-1',
      firstName: 'Dale',
      lastName: 'Cooper',
      email: 'coop@example.co',
      organizations: [{ id: 'org-1', name: "Twin Peaks Sheriff's Department" }],
      isHmisUser: false,
    },
    mockNavigate: vi.fn(),
    mockShowSnackbar: vi.fn(),
    mockSignOut: vi.fn(),
  }),
);

vi.mock('expo-router', () => ({
  useNavigation: () => ({ setOptions: vi.fn() }),
  useRouter: () => ({ navigate: mockNavigate }),
}));

vi.mock('../../hooks', () => ({
  useUser: () => ({ user: USER }),
  useSignOut: () => ({ signOut: mockSignOut }),
  useSnackbar: () => ({ showSnackbar: mockShowSnackbar }),
}));

// The real design-system barrel re-exports native-backed components (camera,
// clipboard, PDF viewer) whose import chains cannot load under vitest-native.
// Stub the barrel to the pieces UserProfile renders, reproducing DeleteModal's
// two-step contract — the trigger only opens the confirmation, and `onDelete`
// runs from the modal's own confirm button (testID `delete-modal-confirm-btn`,
// matching the real component) — so the spec exercises the screen's handler.
vi.mock('@monorepo/expo/shared/ui-components', () => ({
  Avatar: () => null,
  Button: ({
    title,
    onPress,
    disabled,
    testID,
    accessibilityHint,
  }: {
    title?: string;
    onPress?: () => void;
    disabled?: boolean;
    testID?: string;
    accessibilityHint?: string;
  }) => (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityHint={accessibilityHint}
      disabled={disabled}
      onPress={onPress}
    >
      <Text>{title}</Text>
    </Pressable>
  ),
  DeleteModal: ({
    button,
    onDelete,
  }: {
    button?: ReactElement<{ onPress?: () => void }>;
    onDelete?: () => void;
  }) => {
    const [visible, setVisible] = useState(false);

    return (
      <>
        {button
          ? // eslint-disable-next-line @eslint-react/no-clone-element
            cloneElement(button, { onPress: () => setVisible(true) })
          : null}
        {visible ? (
          <Pressable
            testID="delete-modal-confirm-btn"
            accessibilityRole="button"
            onPress={() => {
              onDelete?.();
              setVisible(false);
            }}
          >
            <Text>Delete</Text>
          </Pressable>
        ) : null}
      </>
    );
  },
  TextBold: ({ children }: { children?: ReactNode }) => <Text>{children}</Text>,
  TextButton: ({ title }: { title?: string }) => <Text>{title}</Text>,
  TextMedium: ({ children }: { children?: ReactNode }) => (
    <Text>{children}</Text>
  ),
}));

const REFUSAL_MESSAGE =
  "You own Twin Peaks Sheriff's Department. Transfer ownership to another member before deleting your account.";

function renderProfile(payload: unknown) {
  const link = new ApolloLink(
    () =>
      new Observable((observer) => {
        observer.next({ data: { deleteCurrentUser: payload } } as never);
        observer.complete();
      }),
  );
  const client = new ApolloClient({ link, cache: new InMemoryCache() });
  const wrapper = ({ children }: { children: ReactNode }) => (
    <ApolloProvider client={client}>{children}</ApolloProvider>
  );

  render(<UserProfile />, { wrapper });
}

function confirmDelete() {
  fireEvent.press(screen.getByText('Delete My Account'));
  fireEvent.press(screen.getByTestId('delete-modal-confirm-btn'));
}

describe('UserProfile account deletion', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('signs the user out once the account is deleted', async () => {
    renderProfile({ __typename: 'DeletedObjectType', id: 1 });

    confirmDelete();

    await waitFor(() => expect(mockSignOut).toHaveBeenCalled());
    expect(mockNavigate).toHaveBeenCalledWith('/auth');
    expect(mockShowSnackbar).not.toHaveBeenCalled();
  });

  it('reports a refusal and keeps the user signed in', async () => {
    renderProfile({
      __typename: 'OperationInfo',
      messages: [
        {
          __typename: 'OperationMessage',
          kind: 'ERROR',
          field: null,
          message: REFUSAL_MESSAGE,
        },
      ],
    });

    confirmDelete();

    await waitFor(() =>
      expect(mockShowSnackbar).toHaveBeenCalledWith({
        message: REFUSAL_MESSAGE,
        type: 'error',
      }),
    );
    expect(mockSignOut).not.toHaveBeenCalled();
    expect(mockNavigate).not.toHaveBeenCalled();
  });
});
