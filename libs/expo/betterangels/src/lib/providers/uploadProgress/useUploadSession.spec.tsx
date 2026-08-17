import { fireEvent, render } from '@testing-library/react-native';
import { Text, View } from 'react-native';
import {
  getUploadSession,
  resetUploadProgressAtoms,
} from './uploadProgressAtoms';
import {
  getUploadRunner,
  resetUploadRunners,
} from './uploadRunnerRegistry';
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

vi.mock('./uploadProgressAtoms', async () => {
  const actual = await vi.importActual<
    typeof import('./uploadProgressAtoms')
  >('./uploadProgressAtoms');

  return {
    ...actual,
    // Spy that passes through, so assertions can look at the options the
    // hook built *and* at what actually landed in the store.
    startUploadSession: (...args: Parameters<typeof actual.startUploadSession>) => {
      mocks.startUpload(...args);
      return actual.startUploadSession(...args);
    },
  };
});
let lastHandle: TUploadSessionHandle | undefined;
let lastRetryRefIds: string[] | undefined;

function Harness() {
  const {
    begin,
    setUploadManifest,
    updateUpload,
    failUpload,
    completeUpload,
    endUpload,
  } = useUploadSession();

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
        accessibilityHint="begin an upload with metadata"
        onPress={() => {
          lastHandle = begin(['c.pdf'], {
            label: 'Consent Forms',
            onRetryItems: () => undefined,
            clientId: 'client-1',
            files: [{ uri: 'file://c.pdf', type: 'application/pdf' }],
          });
        }}
      >
        begin-nc
      </Text>
      <Text
        accessibilityRole="button"
        accessibilityLabel="begin retryable"
        accessibilityHint="begin an upload with per-item retry"
        onPress={() => {
          lastHandle = begin(['x.pdf', 'y.pdf'], {
            refIds: ['ref-x', 'ref-y'],
            onRetryItems: (refIds) => {
              lastRetryRefIds = refIds;
            },
          });
        }}
      >
        begin-r
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
          updateUpload(lastHandle?.id ?? 'session-x', {
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
        onPress={() => endUpload(lastHandle?.id ?? 'session-x')}
      >
        end
      </Text>
    </View>
  );
}

describe('useUploadSession', () => {
  beforeEach(() => {
    resetUploadRunners();
    resetUploadProgressAtoms();
    lastHandle = undefined;
    lastRetryRefIds = undefined;
    Object.values(mocks).forEach((mock) => mock.mockClear());
  });

  it('begin registers a session with per-file abort signals', () => {
    const { getByLabelText } = render(<Harness />);

    fireEvent.press(getByLabelText('begin'));

    expect(mocks.startUpload).toHaveBeenCalledTimes(1);
    const [id, names, options] = mocks.startUpload.mock.calls[0];

    expect(typeof id).toBe('string');
    expect(names).toEqual(['a.pdf', 'b.pdf']);
    // Capability is a serializable flag on the session; the machinery that
    // performs the cancel lives in the runner registry.
    expect(options.cancellable).toBe(true);
    expect(lastHandle?.id).toBe(id);
    expect(lastHandle?.signals).toHaveLength(2);
    expect(lastHandle?.isAborted()).toBe(false);

    const runner = getUploadRunner(id);
    expect(runner).toBeDefined();

    // Cancelling by refId aborts only that file's signal.
    runner?.cancelItem('pending-0');
    expect(lastHandle?.signals[0]?.aborted).toBe(true);
    expect(lastHandle?.signals[1]?.aborted).toBe(false);
    expect(lastHandle?.isAborted()).toBe(false);

    runner?.cancelItem('pending-1');
    expect(lastHandle?.isAborted()).toBe(true);
  });

  it('begin forwards label, client and preview metadata', () => {
    const { getByLabelText } = render(<Harness />);

    fireEvent.press(getByLabelText('begin non-cancellable'));

    const [id, names, options] = mocks.startUpload.mock.calls[0];

    expect(names).toEqual(['c.pdf']);
    expect(options.cancellable).toBe(true);
    expect(options.label).toBe('Consent Forms');
    expect(options.retryable).toBe(true);
    expect(options.clientId).toBe('client-1');
    expect(options.files).toEqual([
      { uri: 'file://c.pdf', type: 'application/pdf' },
    ]);
    expect(lastHandle?.id).toBe(id);
    expect(lastHandle?.signals).toHaveLength(1);
    expect(lastHandle?.isAborted()).toBe(false);
  });

  it('forwards caller-owned refIds and the in-place retry callback', () => {
    const { getByLabelText } = render(<Harness />);

    fireEvent.press(getByLabelText('begin retryable'));

    const [id, names, options] = mocks.startUpload.mock.calls[0];

    expect(names).toEqual(['x.pdf', 'y.pdf']);
    expect(options.label).toBeUndefined();
    expect(options.cancellable).toBe(true);
    expect(options.retryable).toBe(true);
    // Stable identity so a retry run reports against the same rows.
    expect(options.refIds).toEqual(['ref-x', 'ref-y']);

    // Retry hands back every refId being re-run, so several failed files
    // can be retried in a single transport run.
    getUploadRunner(id)?.rerun(['ref-x', 'ref-y']);
    expect(lastRetryRefIds).toEqual(['ref-x', 'ref-y']);
    expect(lastHandle?.id).toBe(id);
  });

  it('renewSignals swaps in fresh controllers for a retry run', () => {
    const { getByLabelText } = render(<Harness />);

    fireEvent.press(getByLabelText('begin'));

    const [id] = mocks.startUpload.mock.calls[0];
    const original = lastHandle?.signals ?? [];

    getUploadRunner(id)?.cancelItem('pending-0');
    expect(original[0]?.aborted).toBe(true);

    // A retried file needs a controller that is not already aborted, or the
    // pipeline would skip it as cancelled the moment it started.
    const renewed = lastHandle?.renewSignals([0]) ?? [];
    expect(renewed[0]?.aborted).toBe(false);
    expect(renewed[0]).not.toBe(original[0]);
    // Untouched files keep their existing controller.
    expect(renewed[1]).toBe(original[1]);

    // Cancel still aborts the run that is actually in flight.
    getUploadRunner(id)?.cancelItem('pending-0');
    expect(renewed[0]?.aborted).toBe(true);
  });

  it('forwards the session mutators to the real store', () => {
    const { getByLabelText } = render(<Harness />);

    fireEvent.press(getByLabelText('begin'));
    const [id] = mocks.startUpload.mock.calls[0];

    // These used to be re-exported through a context-era wrapper hook, so
    // the old test could only prove one mock called another. Assert the
    // store actually moves instead.
    // `begin` already registered the session through the real store.
    fireEvent.press(getByLabelText('progress'));
    expect(getUploadSession(id)).toBeDefined();

    fireEvent.press(getByLabelText('end'));
    expect(getUploadSession(id)).toBeUndefined();
  });
});
