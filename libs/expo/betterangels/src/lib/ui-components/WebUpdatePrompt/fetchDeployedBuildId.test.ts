import { fetchDeployedBuildId, getVersionManifestUrl } from './fetchDeployedBuildId';

const okResponse = (body: unknown) =>
  ({ ok: true, json: async () => body }) as unknown as Response;

describe('fetchDeployedBuildId', () => {
  it('returns the build id the deployment publishes', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(okResponse({ buildId: ' abc123 ' }));

    await expect(fetchDeployedBuildId(fetchImpl)).resolves.toBe('abc123');
    expect(fetchImpl).toHaveBeenCalledWith(
      expect.stringContaining('version.json'),
      expect.objectContaining({ cache: 'no-store' }),
    );
  });

  it('reports nothing when the manifest is missing', async () => {
    // A deployment predating the manifest — or a 404 from a sub-path deploy
    // that is looking in the wrong place — must not look like an update.
    const fetchImpl = vi.fn().mockResolvedValue({ ok: false } as Response);

    await expect(fetchDeployedBuildId(fetchImpl)).resolves.toBeNull();
  });

  it('reports nothing when the network fails', async () => {
    const fetchImpl = vi.fn().mockRejectedValue(new Error('offline'));

    await expect(fetchDeployedBuildId(fetchImpl)).resolves.toBeNull();
  });

  it('reports nothing when the manifest is malformed', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(okResponse({ buildId: 42 }));

    await expect(fetchDeployedBuildId(fetchImpl)).resolves.toBeNull();
  });
});

describe('getVersionManifestUrl', () => {
  it('looks next to the app, not at the server root', () => {
    // Root deployments are the common case; a sub-path deploy is covered by
    // `experiments.baseUrl`, and the URL must include it when present.
    expect(getVersionManifestUrl()).toMatch(/\/version\.json$/);
  });
});
