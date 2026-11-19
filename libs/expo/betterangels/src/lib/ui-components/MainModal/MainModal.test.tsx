/**
 * The sheet's close-then-navigate rule.
 *
 * Pressing an action used to navigate while the sheet animated out, which
 * segfaulted iOS inside Fabric's mounting layer. Nothing else asserts the
 * ordering, the fallback for an interrupted close, or that only one of the two
 * paths ever navigates.
 */
/* eslint-disable @eslint-react/no-nested-component-definitions -- vi.mock
   factories are hoisted above every top-level declaration, so the stubs have to
   be defined inline. */
import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { Text, View } from 'react-native';
import { MainModal } from './MainModal';

const router = vi.hoisted(() => ({ navigate: vi.fn() }));

const baseModal = vi.hoisted(() => ({
  /** Captured so a test can fire the end of the out-animation. */
  onCloseComplete: null as null | (() => void),
}));

vi.mock('expo-router', () => ({ useRouter: () => router }));

vi.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

vi.mock('@monorepo/expo/shared/ui-components', () => ({
  BaseModal: ({
    children,
    isOpen,
    onCloseComplete,
  }: {
    children: React.ReactNode;
    isOpen: boolean;
    onCloseComplete?: () => void;
  }) => {
    baseModal.onCloseComplete = onCloseComplete ?? null;

    return isOpen ? <View>{children}</View> : null;
  },
}));

vi.mock('./MainModalActionBtn', () => ({
  MainModalActionBtn: ({
    testId,
    onPress,
  }: {
    testId?: string;
    onPress: () => void;
  }) => (
    <Text testID={testId} onPress={onPress}>
      action
    </Text>
  ),
}));

vi.mock('./MainModalCloseBtn', () => ({ MainModalCloseBtn: () => null }));

const closeModal = vi.fn();

function renderModal() {
  return render(
    <MainModal
      isModalVisible
      closeModal={closeModal}
      actions={[
        {
          title: 'Find shelter',
          testId: 'find-shelter-btn',
          Icon: () => <View />,
          route: '/find-shelter',
          params: { from: 'modal' },
        },
      ]}
    />,
  );
}

async function pressAction() {
  await fireEvent.press(screen.getByTestId('find-shelter-btn'));
}

async function finishClose() {
  await act(async () => baseModal.onCloseComplete?.());
}

beforeEach(() => {
  vi.useFakeTimers();
  router.navigate.mockReset();
  closeModal.mockReset();
});

afterEach(() => {
  vi.useRealTimers();
});

it('closes the sheet before navigating', async () => {
  await renderModal();
  await pressAction();

  expect(closeModal).toHaveBeenCalled();
  // The crash: navigating while this animation is still running.
  expect(router.navigate).not.toHaveBeenCalled();

  await finishClose();

  expect(router.navigate).toHaveBeenCalledWith({
    pathname: '/find-shelter',
    params: { from: 'modal' },
  });
});

it('navigates on its own when the close never reports back', async () => {
  await renderModal();
  await pressAction();

  await act(async () => {
    vi.advanceTimersByTime(799);
  });
  expect(router.navigate).not.toHaveBeenCalled();

  await act(async () => {
    vi.advanceTimersByTime(1);
  });
  expect(router.navigate).toHaveBeenCalledTimes(1);
});

it('navigates once when both the animation and the fallback fire', async () => {
  await renderModal();
  await pressAction();

  await act(async () => {
    vi.advanceTimersByTime(1000);
  });
  await finishClose();

  expect(router.navigate).toHaveBeenCalledTimes(1);
});

it('does not navigate after the sheet is gone', async () => {
  const { unmount } = await renderModal();
  await pressAction();

  await unmount();

  await act(async () => {
    vi.advanceTimersByTime(1000);
  });
  expect(router.navigate).not.toHaveBeenCalled();
});
