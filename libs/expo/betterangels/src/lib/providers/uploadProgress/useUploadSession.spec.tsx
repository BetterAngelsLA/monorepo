import { fireEvent, render } from '@testing-library/react-native';
import { Text, View } from 'react-native';
import { useUploadSession, TUploadSessionHandle } from './useUploadSession';

vi.mock('expo-crypto', () => ({
  randomUUID: () => 'session-generated',
}));

const mocks = vi.hoisted(() => ({
  startUpload: vi.fn(),
  setUploadManifest: vi.fn(),
  updateUpload: vi.fn(),
  failUpload: vi.fn(),
  completeUpload: vi.fn(),
  endUpload: vi.fn(),
}));

vi.mock('./UploadProgressContext', () => ({
  useUploadProgress: () => ({
    sessions: [],
    startUpload: mocks.startUpload,
    setUploadManifest: mocks.setUploadManifest,
    updateUpload: mocks.updateUpload,
    failUpload: mocks.failUpload,
    completeUpload: mocks.completeUpload,
    endUpload: mocks.endUpload,
    cancelUpload: vi.fn(),
  }),
}));

let lastHandle: TUploadSessionHandle | undefined;

function Harness() {
  const { begin, setUploadManifest, updateUpload, failUpload, completeUpload, endUpload } =
    useUploadSession();

  return (
    <View>
      <Text
        accessibilityRole="button"
        accessibilityLabel="begin"
        accessibilityHint="begin an upload"
        onPress={() => {
          lastHandle = begin(['a.pdf', 'b.pdf']);
        }}
      >
        begin
      </Text>
      <Text
        accessibilityRole="button"
        accessibilityLabel="begin non-cancellable"
        accessibilityHint="begin a non-abortable upload"
        onPress={() => {
          lastHandle = begin(['c.pdf'], { cancellable: false });
        }}
      >
        begin-nc
      </Text>
      <Text
        accessibilityRole="button"
        accessibilityLabel="manifest"
        accessibilityHint="set the manifest"
        onPress={() =>
          setUploadManifest('session-x', [
            { refId: 'r1', file: { name: 'a.pdf' } },
          ])
        }
      >
        manifest
      </Text>
      <Text
        accessibilityRole="button"
        accessibilityLabel="progress"
        accessibilityHint="send progress"
        onPress={() =>
          updateUpload('session-x', {
            stage: 'UPLOADING',
            completed: 1,
            total: 2,
          })
        }
      >
        progress
      </Text>
      <Text
        accessibilityRole="button"
        accessibilityLabel="fail"
        accessibilityHint="fail the upload"
        onPress={() => failUpload('session-x', 'boom')}
      >
        fail
      </Text>
      <Text
        accessibilityRole="button"
        accessibilityLabel="complete"
        accessibilityHint="complete the upload"
        onPress={() => completeUpload('session-x')}
      >
        complete
      </Text>
      <Text
        accessibilityRole="button"
        accessibilityLabel="end"
        accessibilityHint="end the upload"
        onPress={() => endUpload('session-x')}
      >
        end
      </Text>
    </View>
  );
}

describe('useUploadSession', () => {
  beforeEach(() => {
    lastHandle = undefined;
    Object.values(mocks).forEach((mock) => mock.mockClear());
  });

  it('begin registers a session with the file names and an abortable signal', () => {
    const { getByLabelText } = render(<Harness />);

    fireEvent.press(getByLabelText('begin'));

    expect(mocks.startUpload).toHaveBeenCalledTimes(1);
    const [id, names, onCancel] = mocks.startUpload.mock.calls[0];

    expect(typeof id).toBe('string');
    expect(names).toEqual(['a.pdf', 'b.pdf']);
    expect(typeof onCancel).toBe('function');
    expect(lastHandle?.id).toBe(id);
    expect(lastHandle?.isAborted()).toBe(false);

    // The onCancel passed to the provider aborts the session's signal.
    onCancel();
    expect(lastHandle?.isAborted()).toBe(true);
    expect(lastHandle?.signal?.aborted).toBe(true);
  });

  it('begin with cancellable false registers a non-abortable session', () => {
    const { getByLabelText } = render(<Harness />);

    fireEvent.press(getByLabelText('begin non-cancellable'));

    const [id, names, onCancel] = mocks.startUpload.mock.calls[0];

    expect(names).toEqual(['c.pdf']);
    // No onCancel → the drawer will not show a cancel button.
    expect(onCancel).toBeUndefined();
    expect(lastHandle?.id).toBe(id);
    expect(lastHandle?.signal).toBeUndefined();
    expect(lastHandle?.isAborted()).toBe(false);
  });

  it('forwards setUploadManifest, updateUpload, failUpload, completeUpload and endUpload', () => {
    const { getByLabelText } = render(<Harness />);

    fireEvent.press(getByLabelText('manifest'));
    fireEvent.press(getByLabelText('progress'));
    fireEvent.press(getByLabelText('fail'));
    fireEvent.press(getByLabelText('complete'));
    fireEvent.press(getByLabelText('end'));

    expect(mocks.setUploadManifest).toHaveBeenCalledWith('session-x', [
      { refId: 'r1', file: { name: 'a.pdf' } },
    ]);
    expect(mocks.updateUpload).toHaveBeenCalledWith('session-x', {
      stage: 'UPLOADING',
      completed: 1,
      total: 2,
    });
    expect(mocks.failUpload).toHaveBeenCalledWith('session-x', 'boom');
    expect(mocks.completeUpload).toHaveBeenCalledWith('session-x');
    expect(mocks.endUpload).toHaveBeenCalledWith('session-x');
  });
});
