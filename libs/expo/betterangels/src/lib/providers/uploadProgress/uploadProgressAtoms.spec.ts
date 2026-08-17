import { getDefaultStore } from 'jotai';
import {
  cancelUploadItemSession,
  completeUploadSession,
  failUploadSession,
  markUploadPartiallyFailed,
  getUploadSession,
  resetUploadProgressAtoms,
  startUploadSession,
  updateUploadSession,
  uploadSessionsAtom,
} from './uploadProgressAtoms';
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
  startUploadSession(id, names, { clientId: 'client-1' });
  // Stand in for the pipeline manifest so refIds are addressable.
  return names.map((_, index) => `pending-${index}`);
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

  it('leaves other sessions untouched', () => {
    beginSession('s1', ['a.pdf', 'b.pdf']);
    beginSession('s2', ['c.pdf', 'd.pdf']);

    completeUploadSession('s1');

    expect(statuses('s2')).toEqual(['pending', 'pending']);
    expect(store.get(uploadSessionsAtom)).toHaveLength(2);
  });
});
