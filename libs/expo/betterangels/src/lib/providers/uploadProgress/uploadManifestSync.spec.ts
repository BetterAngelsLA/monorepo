import {
  completeUploadSession,
  endUploadSession,
  recordUploadCredentials,
  resetUploadProgressAtoms,
  startUploadSession,
  updateUploadSession,
} from './uploadProgressAtoms';
import { loadResumableManifests } from './uploadManifestStore';
import { startUploadManifestSync } from './uploadManifestSync';

const backing = new Map<string, string>();

vi.mock('@react-native-async-storage/async-storage', () => ({
  __esModule: true,
  default: {
    getItem: async (key: string) => backing.get(key) ?? null,
    setItem: async (key: string, value: string) => {
      backing.set(key, value);
    },
    removeItem: async (key: string) => {
      backing.delete(key);
    },
  },
}));

const NOW = 1_700_000_000_000;
const flush = () => new Promise((resolve) => setTimeout(resolve, 0));

function startResumable(id: string) {
  startUploadSession(id, ['a.pdf', 'b.pdf'], {
    refIds: ['ref-a', 'ref-b'],
    clientId: 'client-1',
    namespace: 'OTHER_DOC',
    createdAt: NOW,
    files: [
      { uri: 'file://a.pdf', type: 'application/pdf' },
      { uri: 'file://b.pdf', type: 'application/pdf' },
    ],
  });
}

describe('uploadManifestSync', () => {
  let stop: () => void;

  beforeEach(() => {
    backing.clear();
    resetUploadProgressAtoms();
    stop = startUploadManifestSync();
  });

  afterEach(() => {
    stop();
    resetUploadProgressAtoms();
  });

  it('persists a resumable session without the runner writing to disk', async () => {
    startResumable('s1');
    await flush();

    // The upload runner only ever touches the session; the manifest is a
    // projection of it. Two write paths for one event is what produced
    // every counter bug this module has had.
    const [saved] = await loadResumableManifests(NOW);
    expect(saved).toMatchObject({
      id: 's1',
      clientProfileId: 'client-1',
      namespace: 'OTHER_DOC',
    });
    expect(saved.items.map((item) => item.uri)).toEqual([
      'file://a.pdf',
      'file://b.pdf',
    ]);
  });

  it('carries S3 credentials through so a resume can skip re-uploading', async () => {
    startResumable('s1');
    recordUploadCredentials('s1', [
      { refId: 'ref-a', presignedKey: 'keys/a', uploadToken: 'token-a' },
    ]);
    updateUploadSession('s1', {
      stage: 'UPLOADING',
      completed: 1,
      total: 2,
      refId: 'ref-a',
      status: 'done',
    });
    await flush();

    const [saved] = await loadResumableManifests(NOW);
    expect(saved.items[0]).toMatchObject({
      status: 'uploaded',
      presignedKey: 'keys/a',
      uploadToken: 'token-a',
    });
  });

  it('drops the manifest once everything is saved', async () => {
    startResumable('s1');
    await flush();

    completeUploadSession('s1');
    await flush();

    // Fully persisted work has nothing left to recover.
    expect(await loadResumableManifests(NOW)).toHaveLength(0);
  });

  it('drops the manifest when its session goes away', async () => {
    startResumable('s1');
    await flush();

    endUploadSession('s1');
    await flush();

    expect(await loadResumableManifests(NOW)).toHaveLength(0);
  });

  it('ignores sessions with no cold-start context', async () => {
    // No namespace/clientId/uri: nothing a fresh process could act on.
    startUploadSession('s1', ['a.pdf'], { refIds: ['ref-a'] });
    await flush();

    expect(await loadResumableManifests(NOW)).toHaveLength(0);
  });
});
