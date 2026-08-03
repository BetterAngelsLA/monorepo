import { fireEvent, render } from '@testing-library/react-native';
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

vi.mock('./UploadProgressDrawer', () => ({
  UploadProgressDrawer: () => null,
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
    cancelUpload,
  } = useUploadProgress();

  return (
    <View>
      <Text testID="drawer-count">{sessions.length}</Text>
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
        accessibilityHint="cancel the cancelable upload"
        onPress={() => cancelUpload('c')}
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
    expect(getByTestId('drawer-count').props.children).toBe(1);

    fireEvent.press(getByLabelText('start'));
    expect(getByTestId('drawer-count').props.children).toBe(2);
  });

  it('tracks a session through start, progress, and completion', () => {
    const { getByLabelText, getByTestId, queryByTestId } = render(
      <UploadProgressProvider>
        <Harness />
      </UploadProgressProvider>,
    );

    expect(getByTestId('drawer-count').props.children).toBe(0);

    fireEvent.press(getByLabelText('start'));
    expect(getByTestId('drawer-count').props.children).toBe(1);
    expect(getByTestId('session-a').props.children).toEqual([0, '/', 2]);

    fireEvent.press(getByLabelText('manifest'));
    fireEvent.press(getByLabelText('update done'));
    expect(getByTestId('session-a').props.children).toEqual([1, '/', 2]);

    fireEvent.press(getByLabelText('end'));
    expect(queryByTestId('session-a')).toBeNull();
    expect(getByTestId('drawer-count').props.children).toBe(0);
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

    // Session stays open so the drawer can show the failure + Close action.
    expect(getByTestId('drawer-count').props.children).toBe(1);
    expect(getByTestId('session-a-failed').props.children).toBe('failed');
    expect(getByTestId('session-a-error').props.children).toBe(
      'Something went wrong.',
    );

    fireEvent.press(getByLabelText('end'));
    expect(queryByTestId('session-a')).toBeNull();
  });

  it('completeUpload keeps the session in a completed state until dismissed', () => {
    const { getByLabelText, getByTestId, queryByTestId } = render(
      <UploadProgressProvider>
        <Harness />
      </UploadProgressProvider>,
    );

    fireEvent.press(getByLabelText('start'));
    expect(getByTestId('session-a-complete').props.children).toBe('incomplete');

    fireEvent.press(getByLabelText('complete'));

    // Session stays open so the drawer can show the completion + Close action.
    expect(getByTestId('drawer-count').props.children).toBe(1);
    expect(getByTestId('session-a-complete').props.children).toBe('complete');

    fireEvent.press(getByLabelText('end'));
    expect(queryByTestId('session-a')).toBeNull();
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
    expect(first.getByTestId('drawer-count').props.children).toBe(1);

    first.unmount();

    const second = render(
      <UploadProgressProvider>
        <Harness />
      </UploadProgressProvider>,
    );

    expect(second.getByTestId('drawer-count').props.children).toBe(1);
    expect(second.getByTestId('session-a')).toBeTruthy();
  });

  it('cancels a session and invokes its onCancel handler', () => {
    const onCancel = vi.fn();

    function CancelHarness() {
      const { sessions, startUpload, cancelUpload } = useUploadProgress();

      return (
        <View>
          <Text testID="drawer-count">{sessions.length}</Text>
          {sessions.map((session) => (
            <Text key={session.id} testID={`session-${session.id}`}>
              {session.completed}/{session.total}
            </Text>
          ))}
          <Text
            accessibilityRole="button"
            accessibilityLabel="start"
            accessibilityHint="start an upload"
            onPress={() => startUpload('c', ['z.pdf'], onCancel)}
          >
            start
          </Text>
          <Text
            accessibilityRole="button"
            accessibilityLabel="cancel"
            accessibilityHint="cancel the upload"
            onPress={() => cancelUpload('c')}
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
    expect(getByTestId('session-c').props.children).toEqual([0, '/', 1]);

    fireEvent.press(getByLabelText('cancel'));

    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(queryByTestId('session-c')).toBeNull();
    expect(getByTestId('drawer-count').props.children).toBe(0);
  });
});
