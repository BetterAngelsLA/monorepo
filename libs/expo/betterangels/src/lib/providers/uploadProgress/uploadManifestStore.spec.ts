import {
  canReusePresign,
  deleteUploadManifest,
  loadResumableManifests,
  MANIFEST_MAX_AGE_MS,
  PRESIGN_REUSE_WINDOW_MS,
  resetUploadManifests,
  saveUploadManifest,
  updateUploadManifestItems,
  type TPersistedUploadSession,
} from './uploadManifestStore';

const store = new Map<string, string>();

vi.mock('@react-native-async-storage/async-storage', () => ({
  __esModule: true,
  default: {
    getItem: async (key: string) => store.get(key) ?? null,
    setItem: async (key: string, value: string) => {
      store.set(key, value);
    },
    removeItem: async (key: string) => {
      store.delete(key);
    },
  },
}));

const NOW = 1_700_000_000_000;

function manifest(
  overrides: Partial<TPersistedUploadSession> = {},
): TPersistedUploadSession {
  return {
    id: 's1',
    clientProfileId: 'client-1',
    namespace: 'OTHER_DOC',
    label: 'Other',
    createdAt: NOW,
    items: [
      {
        refId: 'ref-a',
        name: 'a.pdf',
        uri: 'file://a.pdf',
        mimeType: 'application/pdf',
        status: 'pending',
      },
    ],
    ...overrides,
  };
}

describe('uploadManifestStore', () => {
  beforeEach(async () => {
    store.clear();
    await resetUploadManifests();
  });

  it('round-trips a manifest', async () => {
    await saveUploadManifest(manifest());

    const loaded = await loadResumableManifests(NOW);

    expect(loaded).toHaveLength(1);
    expect(loaded[0].clientProfileId).toBe('client-1');
  });

  it('replaces rather than duplicating on re-save', async () => {
    await saveUploadManifest(manifest());
    await saveUploadManifest(manifest({ label: 'Renamed' }));

    const loaded = await loadResumableManifests(NOW);

    expect(loaded).toHaveLength(1);
    expect(loaded[0].label).toBe('Renamed');
  });

  it('does not offer a fully saved manifest for resume', async () => {
    await saveUploadManifest(
      manifest({
        items: [
          {
            refId: 'ref-a',
            name: 'a.pdf',
            uri: 'file://a.pdf',
            mimeType: 'application/pdf',
            status: 'done',
          },
        ],
      }),
    );

    expect(await loadResumableManifests(NOW)).toHaveLength(0);
  });

  it('drops manifests that have aged out', async () => {
    await saveUploadManifest(manifest());

    const loaded = await loadResumableManifests(NOW + MANIFEST_MAX_AGE_MS + 1);

    // The local file has almost certainly been purged by now, and silently
    // re-uploading something picked days ago would surprise the user.
    expect(loaded).toHaveLength(0);
  });

  it('records per-item upload credentials', async () => {
    await saveUploadManifest(manifest());

    await updateUploadManifestItems('s1', (items) =>
      items.map((item) => ({
        ...item,
        status: 'uploaded',
        presignedKey: 'keys/ref-a',
        uploadToken: 'token-a',
      })),
    );

    const [loaded] = await loadResumableManifests(NOW);
    expect(loaded.items[0]).toMatchObject({
      status: 'uploaded',
      presignedKey: 'keys/ref-a',
      uploadToken: 'token-a',
    });
  });

  it('deletes a manifest', async () => {
    await saveUploadManifest(manifest());
    await deleteUploadManifest('s1');

    expect(await loadResumableManifests(NOW)).toHaveLength(0);
  });

  it('survives corrupt stored data', async () => {
    store.set('betterangels.uploadManifests.v1', '{ not json');

    // A bad record must cost a resume, never the app launch.
    await expect(loadResumableManifests(NOW)).resolves.toEqual([]);
  });

  describe('canReusePresign', () => {
    const uploaded = manifest({
      items: [
        {
          refId: 'ref-a',
          name: 'a.pdf',
          uri: 'file://a.pdf',
          mimeType: 'application/pdf',
          status: 'uploaded',
          presignedKey: 'keys/ref-a',
          uploadToken: 'token-a',
        },
      ],
    });

    it('reuses credentials inside the window', () => {
      expect(canReusePresign(uploaded, uploaded.items[0], NOW + 1000)).toBe(
        true,
      );
    });

    it('refuses once the presign has expired', () => {
      // The server rejects these after ~300s; presenting them anyway would
      // fail mid-request instead of falling back to a re-upload.
      expect(
        canReusePresign(
          uploaded,
          uploaded.items[0],
          NOW + PRESIGN_REUSE_WINDOW_MS + 1,
        ),
      ).toBe(false);
    });

    it('refuses for a file whose bytes never reached S3', () => {
      const pending = manifest();
      expect(canReusePresign(pending, pending.items[0], NOW)).toBe(false);
    });
  });
});
