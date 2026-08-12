import { act, fireEvent, render } from '@testing-library/react-native';
import { ReactNode } from 'react';
import { Text, View } from 'react-native';
import { useUploadProgress } from './UploadProgressContext';
import { UploadProgressProvider } from './UploadProgressProvider';
import { resetUploadProgressStore } from './uploadProgressStore';

vi.mock('@monorepo/expo/shared/ui-components', () => ({
  TextBold: ({ children }: { children: ReactNode }) => <Text>{children}</Text>,
  TextRegular: ({ children }: { children: ReactNode }) => (
    <Text>{children}</Text>
  ),
}));

function Harness() {
  const {
    sessions,
    startUpload,
    setUploadManifest,
    updateUpload,
    failUpload,
    completeUpload,
    endUpload,
    cancelUploadItem,
  } = useUploadProgress();

  return (
    <View>
      <Text testID="session-count">{sessions.length}</Text>
      {sessions.map((session) => (
        <View key={session.id}>
          <Text testID={`session-${session.id}`}>
            {session.completed}/{session.total}
          </Text>
          <Text testID={`session-${session.id}-failed`}>
            {session.failed ? 'failed' : 'ok'}
          </Text>
          <Text testID={`session-${session.id}-complete`}>
            {session.complete ? 'complete' : 'incomplete'}
          </Text>
          <Text testID={`session-${session.id}-error`}>
            {session.errorMessage ?? 'none'}
          </Text>
        </View>
      ))}
      <Text
        accessibilityRole="button"
        accessibilityLabel="start"
        accessibilityHint="start an upload"
        onPress={() => startUpload('a', ['x.pdf', 'y.pdf'])}
      >
        start
      </Text>
      <Text
        accessibilityRole="button"
        accessibilityLabel="cancel"
        accessibilityHint="cancel the first item"
        onPress={() => cancelUploadItem('a', 'pending-0')}
      >
        cancel
      </Text>
      <Text
        accessibilityRole="button"
        accessibilityLabel="manifest"
        accessibilityHint="set manifest"
        onPress={() =>
          setUploadManifest('a', [
            { refId: 'r1', file: { name: 'x.pdf' } },
            { refId: 'r2', file: { name: 'y.pdf' } },
          ])
        }
      >
        manifest
      </Text>
      <Text
        accessibilityRole="button"
        accessibilityLabel="update done"
        accessibilityHint="mark one file done"
        onPress={() =>
          updateUpload('a', {
            stage: 'UPLOADING',
            completed: 1,
            total: 2,
            refId: 'r1',
            status: 'done',
          })
        }
      >
        update
      </Text>
      <Text
        accessibilityRole="button"
        accessibilityLabel="update error"
        accessibilityHint="mark one file failed"
        onPress={() =>
          updateUpload('a', {
            stage: 'UPLOADING',
            completed: 1,
            total: 2,
            refId: 'r2',
            status: 'error',
          })
        }
      >
        error
      </Text>
      <Text
        accessibilityRole="button"
        accessibilityLabel="fail"
        accessibilityHint="mark the upload failed"
        onPress={() => failUpload('a', 'Something went wrong.')}
      >
        fail
      </Text>
      <Text
        accessibilityRole="button"
        accessibilityLabel="complete"
        accessibilityHint="mark the upload complete"
        onPress={() => completeUpload('a')}
      >
        complete
      </Text>
      <Text
        accessibilityRole="button"
        accessibilityLabel="end"
        accessibilityHint="end the upload"
        onPress={() => endUpload('a')}
      >
        end
      </Text>
    </View>
  );
}

describe('UploadProgressProvider', () => {
  beforeEach(() => {
    // The session store is module-scoped and shared across provider mounts.
    resetUploadProgressStore();
  });

  it('queued uploads accumulate as separate sessions', () => {
    const { getByLabelText, getByTestId } = render(
      <UploadProgressProvider>
        <Harness />
      </UploadProgressProvider>,
    );

    fireEvent.press(getByLabelText('start'));
    expect(getByTestId('session-count').props.children).toBe(1);

    fireEvent.press(getByLabelText('start'));
    expect(getByTestId('session-count').props.children).toBe(2);
  });

  it('tracks a session through start, progress, and completion', () => {
    const { getByLabelText, getByTestId, queryByTestId } = render(
      <UploadProgressProvider>
        <Harness />
      </UploadProgressProvider>,
    );

    expect(getByTestId('session-count').props.children).toBe(0);

    fireEvent.press(getByLabelText('start'));
    expect(getByTestId('session-count').props.children).toBe(1);
    expect(getByTestId('session-a').props.children).toEqual([0, '/', 2]);

    fireEvent.press(getByLabelText('manifest'));
    fireEvent.press(getByLabelText('update done'));
    expect(getByTestId('session-a').props.children).toEqual([1, '/', 2]);

    fireEvent.press(getByLabelText('end'));
    expect(queryByTestId('session-a')).toBeNull();
    expect(getByTestId('session-count').props.children).toBe(0);
  });

  it('marks a session as failed when a file errors', () => {
    const { getByLabelText, getByTestId } = render(
      <UploadProgressProvider>
        <Harness />
      </UploadProgressProvider>,
    );

    fireEvent.press(getByLabelText('start'));
    fireEvent.press(getByLabelText('manifest'));
    fireEvent.press(getByLabelText('update error'));

    expect(getByTestId('session-a').props.children).toEqual([1, '/', 2]);
  });

  it('failUpload keeps the session and records the error message', () => {
    const { getByLabelText, getByTestId, queryByTestId } = render(
      <UploadProgressProvider>
        <Harness />
      </UploadProgressProvider>,
    );

    fireEvent.press(getByLabelText('start'));
    fireEvent.press(getByLabelText('fail'));

    // Session stays open so the docs tree can show the failure + Retry.
    expect(getByTestId('session-count').props.children).toBe(1);
    expect(getByTestId('session-a-failed').props.children).toBe('failed');
    expect(getByTestId('session-a-error').props.children).toBe(
      'Something went wrong.',
    );

    fireEvent.press(getByLabelText('end'));
    expect(queryByTestId('session-a')).toBeNull();
  });

  it('auto-cleans completed sessions shortly after they finish', () => {
    vi.useFakeTimers();

    try {
      const { getByLabelText, getByTestId, queryByTestId } = render(
        <UploadProgressProvider>
          <Harness />
        </UploadProgressProvider>,
      );

      fireEvent.press(getByLabelText('start'));
      fireEvent.press(getByLabelText('complete'));

      // The completed session is still present briefly.
      expect(getByTestId('session-count').props.children).toBe(1);
      expect(getByTestId('session-a-complete').props.children).toBe('complete');

      // After the cleanup delay the session is dropped from the store.
      act(() => {
        vi.advanceTimersByTime(5000);
      });
      expect(queryByTestId('session-a')).toBeNull();
      expect(getByTestId('session-count').props.children).toBe(0);
    } finally {
      vi.useRealTimers();
    }
  });

  it('keeps the session when the provider that started it unmounts', () => {
    // Mirrors the real app: the upload starts in the modal-scoped provider,
    // then the modal closes (that provider unmounts) — the root provider must
    // still show the session because both share the module store.
    const first = render(
      <UploadProgressProvider>
        <Harness />
      </UploadProgressProvider>,
    );

    fireEvent.press(first.getByLabelText('start'));
    expect(first.getByTestId('session-count').props.children).toBe(1);

    first.unmount();

    const second = render(
      <UploadProgressProvider>
        <Harness />
      </UploadProgressProvider>,
    );

    expect(second.getByTestId('session-count').props.children).toBe(1);
    expect(second.getByTestId('session-a')).toBeTruthy();
  });

  it('cancels a single item, invoking its onCancel, and keeps the session', () => {
    const onCancelItem = vi.fn();

    function CancelHarness() {
      const { sessions, startUpload, cancelUploadItem } = useUploadProgress();

      return (
        <View>
          <Text testID="session-count">{sessions.length}</Text>
          {sessions.map((session) => (
            <View key={session.id}>
              <Text testID={`session-${session.id}`}>
                {session.completed}/{session.total}
              </Text>
              {session.items.map((item) => (
                <Text key={item.refId} testID={`item-${item.refId}`}>
                  {item.name}
                </Text>
              ))}
            </View>
          ))}
          <Text
            accessibilityRole="button"
            accessibilityLabel="start"
            accessibilityHint="start an upload"
            onPress={() =>
              startUpload('c', ['z.pdf', 'w.pdf'], { onCancelItem })
            }
          >
            start
          </Text>
          <Text
            accessibilityRole="button"
            accessibilityLabel="cancel item"
            accessibilityHint="cancel the first item"
            onPress={() => cancelUploadItem('c', 'pending-0')}
          >
            cancel
          </Text>
        </View>
      );
    }

    const { getByLabelText, getByTestId, queryByTestId } = render(
      <UploadProgressProvider>
        <CancelHarness />
      </UploadProgressProvider>,
    );

    fireEvent.press(getByLabelText('start'));
    expect(getByTestId('session-c').props.children).toEqual([0, '/', 2]);
    expect(getByTestId('item-pending-0').props.children).toBe('z.pdf');

    fireEvent.press(getByLabelText('cancel item'));

    expect(onCancelItem).toHaveBeenCalledWith(0);
    // The cancelled item is removed; the session stays with the rest.
    expect(queryByTestId('item-pending-0')).toBeNull();
    expect(getByTestId('session-c').props.children).toEqual([0, '/', 1]);
    expect(getByTestId('item-pending-1').props.children).toBe('w.pdf');
  });

  it('removes the session when its last item is cancelled', () => {
    const onCancelItem = vi.fn();

    function SingleHarness() {
      const { sessions, startUpload, cancelUploadItem } = useUploadProgress();

      return (
        <View>
          <Text testID="session-count">{sessions.length}</Text>
          {sessions.map((session) => (
            <Text key={session.id} testID={`session-${session.id}`}>
              {session.completed}/{session.total}
            </Text>
          ))}
          <Text
            accessibilityRole="button"
            accessibilityLabel="start"
            accessibilityHint="start an upload"
            onPress={() => startUpload('s', ['z.pdf'], { onCancelItem })}
          >
            start
          </Text>
          <Text
            accessibilityRole="button"
            accessibilityLabel="cancel item"
            accessibilityHint="cancel the item"
            onPress={() => cancelUploadItem('s', 'pending-0')}
          >
            cancel
          </Text>
        </View>
      );
    }

    const { getByLabelText, getByTestId, queryByTestId } = render(
      <UploadProgressProvider>
        <SingleHarness />
      </UploadProgressProvider>,
    );

    fireEvent.press(getByLabelText('start'));
    fireEvent.press(getByLabelText('cancel item'));

    expect(onCancelItem).toHaveBeenCalledWith(0);
    expect(queryByTestId('session-s')).toBeNull();
    expect(getByTestId('session-count').props.children).toBe(0);
  });

  it('retries a single item via its onRetry and keeps the other items', () => {
    const onRetryItem = vi.fn();

    function RetryHarness() {
      const { sessions, startUpload, retryUploadItem } = useUploadProgress();

      return (
        <View>
          <Text testID="session-count">{sessions.length}</Text>
          {sessions.map((session) => (
            <View key={session.id}>
              <Text testID={`session-${session.id}`}>
                {session.completed}/{session.total}
              </Text>
              {session.items.map((item) => (
                <Text key={item.refId} testID={`item-${item.refId}`}>
                  {item.name}
                </Text>
              ))}
            </View>
          ))}
          <Text
            accessibilityRole="button"
            accessibilityLabel="start"
            accessibilityHint="start an upload"
            onPress={() =>
              startUpload('r', ['z.pdf', 'w.pdf'], { onRetryItem })
            }
          >
            start
          </Text>
          <Text
            accessibilityRole="button"
            accessibilityLabel="retry item"
            accessibilityHint="retry the first item"
            onPress={() => retryUploadItem('r', 'pending-0')}
          >
            retry
          </Text>
        </View>
      );
    }

    const { getByLabelText, getByTestId, queryByTestId } = render(
      <UploadProgressProvider>
        <RetryHarness />
      </UploadProgressProvider>,
    );

    fireEvent.press(getByLabelText('start'));
    expect(getByTestId('item-pending-0').props.children).toBe('z.pdf');

    fireEvent.press(getByLabelText('retry item'));

    // Only the retried file's callback fires; it leaves its session while
    // the other item keeps its state.
    expect(onRetryItem).toHaveBeenCalledWith(0);
    expect(queryByTestId('item-pending-0')).toBeNull();
    expect(getByTestId('item-pending-1').props.children).toBe('w.pdf');
    expect(getByTestId('session-r').props.children).toEqual([0, '/', 1]);
  });

  it('removes the session when its last item is retried', () => {
    const onRetryItem = vi.fn();

    function SingleRetryHarness() {
      const { sessions, startUpload, retryUploadItem } = useUploadProgress();

      return (
        <View>
          <Text testID="session-count">{sessions.length}</Text>
          {sessions.map((session) => (
            <Text key={session.id} testID={`session-${session.id}`}>
              {session.completed}/{session.total}
            </Text>
          ))}
          <Text
            accessibilityRole="button"
            accessibilityLabel="start"
            accessibilityHint="start an upload"
            onPress={() =>
              startUpload('s2', ['z.pdf'], { onRetryItem })
            }
          >
            start
          </Text>
          <Text
            accessibilityRole="button"
            accessibilityLabel="retry item"
            accessibilityHint="retry the item"
            onPress={() => retryUploadItem('s2', 'pending-0')}
          >
            retry
          </Text>
        </View>
      );
    }

    const { getByLabelText, getByTestId, queryByTestId } = render(
      <UploadProgressProvider>
        <SingleRetryHarness />
      </UploadProgressProvider>,
    );

    fireEvent.press(getByLabelText('start'));
    fireEvent.press(getByLabelText('retry item'));

    expect(onRetryItem).toHaveBeenCalledWith(0);
    expect(queryByTestId('session-s2')).toBeNull();
    expect(getByTestId('session-count').props.children).toBe(0);
  });
});
