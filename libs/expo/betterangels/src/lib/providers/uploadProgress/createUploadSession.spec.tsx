import { createUploadSession } from './createUploadSession';
import {
  getUploadSession,
  resetUploadProgressAtoms,
} from './uploadProgressAtoms';
import {
  cancelAllUploadRunners,
  getUploadRunner,
  resetUploadRunners,
} from './uploadRunnerRegistry';

let idCounter = 0;

vi.mock('expo-crypto', () => ({
  randomUUID: () => `session-${idCounter++}`,
}));

describe('createUploadSession', () => {
  beforeEach(() => {
    idCounter = 0;
    resetUploadRunners();
    resetUploadProgressAtoms();
  });

  it('registers a serializable session plus a runner', () => {
    const handle = createUploadSession(['a.pdf', 'b.pdf'], {
      refIds: ['ref-a', 'ref-b'],
      label: 'Other',
      clientId: 'client-1',
      files: [
        { uri: 'file://a.pdf', type: 'application/pdf' },
        { uri: 'file://b.pdf', type: 'application/pdf' },
      ],
    });

    const session = getUploadSession(handle.id);

    expect(session?.items.map((item) => item.refId)).toEqual([
      'ref-a',
      'ref-b',
    ]);
    expect(session?.label).toBe('Other');
    expect(session?.cancellable).toBe(true);
    // No onRetryItems supplied, so the UI must not offer Retry.
    expect(session?.retryable).toBe(false);
    expect(getUploadRunner(handle.id)).toBeDefined();
  });

  it('cancels a single file by refId', () => {
    const handle = createUploadSession(['a.pdf', 'b.pdf'], {
      refIds: ['ref-a', 'ref-b'],
    });

    getUploadRunner(handle.id)?.cancelItem('ref-a');

    expect(handle.signals[0]?.aborted).toBe(true);
    expect(handle.signals[1]?.aborted).toBe(false);
    expect(handle.isAborted()).toBe(false);

    getUploadRunner(handle.id)?.cancelItem('ref-b');
    expect(handle.isAborted()).toBe(true);
  });

  it('renewSignals swaps in fresh controllers for a retry run', () => {
    const handle = createUploadSession(['a.pdf', 'b.pdf'], {
      refIds: ['ref-a', 'ref-b'],
    });
    const original = handle.signals;

    getUploadRunner(handle.id)?.cancelItem('ref-a');
    expect(original[0]?.aborted).toBe(true);

    // A retried file needs a controller that is not already aborted, or the
    // pipeline would skip it as cancelled the moment it started.
    const renewed = handle.renewSignals([0]);
    expect(renewed[0]?.aborted).toBe(false);
    expect(renewed[0]).not.toBe(original[0]);
    expect(renewed[1]).toBe(original[1]);

    // Cancel still aborts the run that is actually in flight.
    getUploadRunner(handle.id)?.cancelItem('ref-a');
    expect(renewed[0]?.aborted).toBe(true);
  });

  it('forwards retry to the caller with every refId being re-run', () => {
    const onRetryItems = vi.fn();
    const handle = createUploadSession(['a.pdf', 'b.pdf'], {
      refIds: ['ref-a', 'ref-b'],
      onRetryItems,
    });

    expect(getUploadSession(handle.id)?.retryable).toBe(true);

    getUploadRunner(handle.id)?.rerun(['ref-a', 'ref-b']);
    expect(onRetryItems).toHaveBeenCalledWith(['ref-a', 'ref-b']);
  });

  it('marks a session resumable only when it carries cold-start context', () => {
    const resumable = createUploadSession(['a.pdf'], {
      refIds: ['ref-a'],
      clientId: 'client-1',
      namespace: 'OTHER_DOC',
      createdAt: 1_700_000_000_000,
    });

    expect(getUploadSession(resumable.id)).toMatchObject({
      clientId: 'client-1',
      namespace: 'OTHER_DOC',
      createdAt: 1_700_000_000_000,
    });
  });

  it('cancelAllUploadRunners aborts every in-flight file', () => {
    const first = createUploadSession(['a.pdf'], { refIds: ['ref-a'] });
    const second = createUploadSession(['b.pdf', 'c.pdf'], {
      refIds: ['ref-b', 'ref-c'],
    });

    // Sign-out: uploads outlive their screens, so nothing else stops them.
    cancelAllUploadRunners();

    expect(first.isAborted()).toBe(true);
    expect(second.isAborted()).toBe(true);
  });
});
