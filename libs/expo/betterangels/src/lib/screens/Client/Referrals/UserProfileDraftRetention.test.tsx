import {
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react-native';
import { Pressable, Text } from 'react-native';
import { uiComponents } from '../../../../__mocks__/sharedBarrels';
import UserProfile from '../../UserProfile';
const { removeUser, discard, signOut, showSnackbar, navigate, setOptions } =
  vi.hoisted(() => ({
    removeUser: vi.fn(),
    discard: vi.fn(),
    signOut: vi.fn(),
    showSnackbar: vi.fn(),
    navigate: vi.fn(),
    setOptions: vi.fn(),
  }));
vi.mock('@apollo/client/react', () => ({ useMutation: () => [removeUser] }));
vi.mock('@monorepo/ba-platform', () => ({
  useApiConfig: () => ({ apiUrl: 'https://test-api' }),
}));
vi.mock('../../../apollo', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../../../apollo')>()),
  extractOperationInfoMessage: () => undefined,
}));
vi.mock('@monorepo/react/shared', () => ({ useFeatureFlagActive: () => true }));
vi.mock('../../../hooks', () => ({
  useUser: () => ({
    user: { id: 'user-1', email: 'fictional@example.com', organizations: [] },
  }),
  useSignOut: () => ({ signOut }),
  useSnackbar: () => ({ showSnackbar }),
}));
vi.mock('expo-router', () => ({
  useNavigation: () => ({ setOptions }),
  useRouter: () => ({ navigate }),
}));
vi.mock('../../../draft/referralDraftStorage', () => ({
  discardAccountReferralDrafts: discard,
}));
vi.mock('@monorepo/expo/shared/ui-components', () => ({
  ...uiComponents(),
  DeleteModal: ({ onDelete }: { onDelete: () => void }) => (
    <Pressable accessibilityRole="button" onPress={onDelete}>
      <Text>Confirm account deletion</Text>
    </Pressable>
  ),
}));
beforeEach(() => {
  vi.clearAllMocks();
  discard.mockReset();
});
it.each([{ __typename: 'OperationInfo', messages: [] }, undefined])(
  'keeps drafts if account deletion is not confirmed: %j',
  async (result) => {
    removeUser.mockResolvedValue({ data: { deleteCurrentUser: result } });
    await render(<UserProfile />);
    await fireEvent.press(screen.getByText('Confirm account deletion'));
    await waitFor(() =>
      expect(showSnackbar).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Your account could not be deleted. Please try again.',
        }),
      ),
    );
    expect(discard).not.toHaveBeenCalled();
    expect(signOut).not.toHaveBeenCalled();
  },
);
it('clears only this account after confirmed server deletion', async () => {
  removeUser.mockResolvedValue({
    data: { deleteCurrentUser: { __typename: 'DeletedObjectType', id: 1 } },
  });
  await render(<UserProfile />);
  await fireEvent.press(screen.getByText('Confirm account deletion'));
  await waitFor(() => expect(signOut).toHaveBeenCalled());
  expect(discard).toHaveBeenCalledExactlyOnceWith({
    apiUrl: 'https://test-api',
    userId: 'user-1',
  });
});
it('still signs out a deleted account if local cleanup fails, and reports the remaining data', async () => {
  removeUser.mockResolvedValue({
    data: { deleteCurrentUser: { __typename: 'DeletedObjectType', id: 1 } },
  });
  discard.mockImplementation(() => {
    throw new Error('disk unavailable');
  });
  await render(<UserProfile />);
  await fireEvent.press(screen.getByText('Confirm account deletion'));
  await waitFor(() => expect(signOut).toHaveBeenCalled());
  expect(showSnackbar).toHaveBeenCalledWith(
    expect.objectContaining({
      message: expect.stringContaining(
        'some local referral drafts could not be removed',
      ),
    }),
  );
});
