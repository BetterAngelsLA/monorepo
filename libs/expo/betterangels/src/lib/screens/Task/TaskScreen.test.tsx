import { render, screen } from '@testing-library/react-native';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import Task from './index';

/**
 * A task that resolves to nothing used to `return null`, which draws a screen
 * with no content at all. That is what a stale link, a deleted task, or a task
 * outside the caller's permissions looks like — and it is indistinguishable
 * from a rendering failure, which is how BACS-128 was reported ("blank
 * screen"). These pin the three ways the screen can end up with no task.
 */
const mocks = vi.hoisted(() => ({
  query: { data: undefined as unknown, loading: false, error: undefined as unknown },
}));

vi.mock('@apollo/client/react', () => ({
  useQuery: () => mocks.query,
}));

// The real barrel reaches `react-native-pdf` through PdfViewer, which a node
// test environment cannot load. Only the shapes the screen renders matter here.
vi.mock('@monorepo/expo/shared/ui-components', async () => {
  const { Text, Pressable } = await import('react-native');

  const passthrough =
    (testID?: string) =>
    ({ children }: { children?: React.ReactNode }) => (
      <Text testID={testID}>{children}</Text>
    );

  return {
    TextBold: passthrough(),
    TextRegular: passthrough(),
    LoadingView: () => null,
    Button: ({ title, onPress }: { title: string; onPress: () => void }) => (
      <Pressable accessibilityRole="button" onPress={onPress}>
        <Text>{title}</Text>
      </Pressable>
    ),
  };
});

vi.mock('expo-router', () => ({
  router: { back: vi.fn(), navigate: vi.fn() },
  useNavigation: () => ({ setOptions: vi.fn() }),
}));

vi.mock('../../hooks', () => ({ useUser: () => ({ user: undefined }) }));

vi.mock('../../ui-components', () => ({
  MainScrollContainer: ({ children }: { children: React.ReactNode }) => (
    <>{children}</>
  ),
  TaskStatusBtn: () => null,
}));

vi.mock('./ShareTaskButton', () => ({ ShareTaskButton: () => null }));

const renderTask = () => render(<Task id="task-1" />);

beforeEach(() => {
  mocks.query = { data: undefined, loading: false, error: undefined };
});

describe('Task screen without a task', () => {
  it('explains that a missing task is unavailable instead of rendering nothing', async () => {
    mocks.query = { data: { task: null }, loading: false, error: undefined };

    await renderTask();

    expect(screen.getByText('This task is not available')).toBeTruthy();
    expect(
      screen.getByText(
        'It may have been deleted, or you may not have access to it.',
      ),
    ).toBeTruthy();
  });

  it('treats a server "not found" answer as unavailable, not a crash', async () => {
    // Apollo reports a missing row as a GraphQL error, so the screen still has
    // to reach the fallback rather than throwing into the crash boundary.
    mocks.query = {
      data: { task: null },
      loading: false,
      error: {
        graphQLErrors: [{ message: 'Task matching query does not exist.' }],
      },
    };

    await renderTask();

    expect(screen.getByText('This task is not available')).toBeTruthy();
  });

  it('still crashes when the request never got an answer', async () => {
    mocks.query = {
      data: undefined,
      loading: false,
      error: { graphQLErrors: [], networkError: new Error('offline') },
    };

    await expect(renderTask()).rejects.toThrow('Something went wrong');
  });
});

