import { getDefaultStore } from 'jotai';
import {
  cancelUploadItemSession,
  completeUploadSession,
  dismissFailedUploadItemsSession,
  endUploadSession,
  failUploadSession,
  markUploadPartiallyFailed,
  getUploadSession,
  resetUploadProgressAtoms,
  retryUploadItemsSession,
  startUploadSession,
  updateUploadSession,
  uploadSessionsAtom,
} from './uploadProgressAtoms';
import { getUploadRunner, registerUploadRunner } from './uploadRunnerRegistry';
import { uploadSessionCounts } from './uploadProgressUtils';

const store = getDefaultStore();

const countsFor = (id: string) => {
  const session = getUploadSession(id);

  if (!session) {
    throw new Error(`no session ${id}`);
  }

  return uploadSessionCounts(session);
};

const statuses = (id: string) =>
  getUploadSession(id)?.items.map((item) => item.status);

function beginSession(id: string, names: string[]) {
  const refIds = names.map((_, index) => `ref-${index}`);

  startUploadSession(id, names, { clientId: 'client-1', refIds });

  return refIds;
}

/** Reports a file's S3 upload finishing (pipeline status 'done'). */
function reportUploaded(id: string, refId: string, completed: number) {
  updateUploadSession(id, {
    stage: 'UPLOADING',
    completed,
    total: 2,
    refId,
    status: 'done',
  });
}

function reportError(id: string, refId: string, completed: number) {
  updateUploadSession(id, {
    stage: 'UPLOADING',
    completed,
    total: 2,
    refId,
    status: 'error',
  });
}

describe('uploadProgressAtoms', () => {
  beforeEach(() => {
    resetUploadProgressAtoms();
  });

  afterEach(() => {
    resetUploadProgressAtoms();
  });

  it('treats a finished S3 upload as uploaded, not saved', () => {
    const [a] = beginSession('s1', ['a.pdf', 'b.pdf']);

    reportUploaded('s1', a, 1);

    // 'done' would claim the file was persisted; only the save step can.
    expect(statuses('s1')).toEqual(['uploaded', 'pending']);
  });

  it('promotes uploaded items to done once the save step finishes', () => {
    const [a, b] = beginSession('s1', ['a.pdf', 'b.pdf']);

    reportUploaded('s1', a, 1);
    reportUploaded('s1', b, 2);
    completeUploadSession('s1');

    expect(statuses('s1')).toEqual(['done', 'done']);
    expect(countsFor('s1')).toEqual({
      total: 2,
      completed: 2,
      failed: false,
      complete: true,
    });
  });

  it('fails uploaded-but-unsaved items when the batch dies before saving', () => {
    const [a, b] = beginSession('s1', ['a.pdf', 'b.pdf']);

    reportUploaded('s1', a, 1);
    reportError('s1', b, 1);
    failUploadSession('s1', 'boom');

    // a.pdf reached S3 but was never persisted — it must be retryable, not
    // shown as a success the user would never re-upload.
    expect(statuses('s1')).toEqual(['error', 'error']);
  });

  it('keeps persisted files done and only the failed one retryable on a partial batch', () => {
    const [a, b] = beginSession('s1', ['a.pdf', 'b.pdf']);

    reportUploaded('s1', a, 1);
    reportError('s1', b, 1);
    // The pipeline saved what it could, then the caller flags the shortfall.
    completeUploadSession('s1');
    markUploadPartiallyFailed('s1', '1 of 2 files failed to upload.');

    expect(statuses('s1')).toEqual(['done', 'error']);
    expect(countsFor('s1')).toEqual({
      total: 2,
      completed: 1,
      failed: true,
      // Not complete, so cleanup cannot prune the retry affordance away.
      complete: false,
    });
    expect(getUploadSession('s1')?.errorMessage).toBe(
      '1 of 2 files failed to upload.',
    );
  });

  it('does not strand simple flows that never report per-item progress', () => {
    // Photo/HMIS uploads call begin + completeUpload without per-item events.
    beginSession('s1', ['photo.jpg']);

    completeUploadSession('s1');

    expect(statuses('s1')).toEqual(['done']);
    expect(countsFor('s1').complete).toBe(true);
  });

  it('keeps counts consistent when an item is cancelled mid-flight', () => {
    const [a, b] = beginSession('s1', ['a.pdf', 'b.pdf']);

    reportUploaded('s1', a, 1);
    cancelUploadItemSession('s1', b);

    // Derived from the surviving items, so the bar can never read
    // "1 of 2" for a session that now holds a single file.
    expect(countsFor('s1')).toEqual({
      total: 1,
      completed: 1,
      failed: false,
      complete: false,
    });

    completeUploadSession('s1');
    expect(countsFor('s1').complete).toBe(true);
  });

  it('dismissing the failed items clears a stuck session entirely', () => {
    const [a, b] = beginSession('s1', ['a.pdf', 'b.pdf']);

    reportError('s1', a, 0);
    reportError('s1', b, 0);
    failUploadSession('s1', 'boom');

    // Failed sessions are never auto-pruned, so without this the global
    // progress bar would stay in its error state for the whole app session.
    dismissFailedUploadItemsSession('s1');

    expect(store.get(uploadSessionsAtom)).toHaveLength(0);
  });

  it('dismissing failed items keeps the successful ones', () => {
    const [a, b] = beginSession('s1', ['a.pdf', 'b.pdf']);

    reportUploaded('s1', a, 1);
    reportError('s1', b, 1);
    completeUploadSession('s1');
    markUploadPartiallyFailed('s1', '1 of 2 files failed to upload.');

    dismissFailedUploadItemsSession('s1');

    expect(statuses('s1')).toEqual(['done']);
    expect(getUploadSession('s1')?.errorMessage).toBeUndefined();
    // Now fully persisted, so the cleanup can prune it normally.
    expect(countsFor('s1').complete).toBe(true);
  });

  it('keeps session state serializable', () => {
    beginSession('s1', ['a.pdf', 'b.pdf']);
    registerUploadRunner('s1', {
      cancelItem: vi.fn(),
      rerun: vi.fn(),
      cancelAll: vi.fn(),
    });

    const sessions = store.get(uploadSessionsAtom);

    // The runner lives in the registry, not on the session. If a callback
    // ever creeps back onto this shape it silently stops round-tripping,
    // and persisting the manifest across app restarts becomes impossible.
    expect(JSON.parse(JSON.stringify(sessions))).toEqual(sessions);
  });

  it('routes cancel and retry through the registered runner', () => {
    const cancelItem = vi.fn();
    const rerun = vi.fn();
    const [a, b] = beginSession('s1', ['a.pdf', 'b.pdf']);
    registerUploadRunner('s1', { cancelItem, rerun, cancelAll: vi.fn() });

    cancelUploadItemSession('s1', b);
    expect(cancelItem).toHaveBeenCalledWith(b);

    reportError('s1', a, 0);
    retryUploadItemsSession('s1', [a]);
    expect(rerun).toHaveBeenCalledWith([a]);
  });

  it('drops the runner when its session ends', () => {
    beginSession('s1', ['a.pdf']);
    registerUploadRunner('s1', {
      cancelItem: vi.fn(),
      rerun: vi.fn(),
      cancelAll: vi.fn(),
    });

    endUploadSession('s1');

    // Runners outlive the component that created them, so nothing else
    // would ever release this.
    expect(getUploadRunner('s1')).toBeUndefined();
  });

  it('leaves other sessions untouched', () => {
    beginSession('s1', ['a.pdf', 'b.pdf']);
    beginSession('s2', ['c.pdf', 'd.pdf']);

    completeUploadSession('s1');

    expect(statuses('s2')).toEqual(['pending', 'pending']);
    expect(store.get(uploadSessionsAtom)).toHaveLength(2);
  });
});
