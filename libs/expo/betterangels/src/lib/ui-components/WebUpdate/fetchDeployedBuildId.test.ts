import {
  buildVersionManifestUrl,
  fetchDeployedBuildId,
  getVersionManifestUrl,
} from './fetchDeployedBuildId';

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
    // looking in the wrong place — must not look like an update.
    const fetchImpl = vi.fn().mockResolvedValue({ ok: false } as Response);

    await expect(fetchDeployedBuildId(fetchImpl)).resolves.toBeNull();
  });

  it('reports nothing when the network fails', async () => {
    const fetchImpl = vi.fn().mockRejectedValue(new Error('offline'));

    await expect(fetchDeployedBuildId(fetchImpl)).resolves.toBeNull();
  });

  it('reports nothing when the body is not JSON', async () => {
    // What the SPA fallback returns for an unknown path: a 200 of index.html.
    const fetchImpl = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => {
        throw new SyntaxError('Unexpected token <');
      },
    } as unknown as Response);

    await expect(fetchDeployedBuildId(fetchImpl)).resolves.toBeNull();
  });

  it('reports nothing for a malformed id', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(okResponse({ buildId: 42 }));

    await expect(fetchDeployedBuildId(fetchImpl)).resolves.toBeNull();
  });
});

describe('buildVersionManifestUrl', () => {
  it('sits at the root of a root deployment', () => {
    expect(buildVersionManifestUrl(undefined)).toBe('/version.json');
    expect(buildVersionManifestUrl(null)).toBe('/version.json');
    expect(buildVersionManifestUrl('')).toBe('/version.json');
  });

  it('sits under the deploy prefix for a branch deploy', () => {
    // A root-absolute path would read another deployment's manifest and prompt
    // on every load, so the prefix is load-bearing.
    expect(buildVersionManifestUrl('/branches/x')).toBe('/branches/x/version.json');
  });

  it('normalises a trailing slash', () => {
    expect(buildVersionManifestUrl('/branches/x/')).toBe('/branches/x/version.json');
  });
});

describe('getVersionManifestUrl', () => {
  it('reads the base path out of the embedded app config', () => {
    // A root export embeds `experiments: {}`.
    expect(getVersionManifestUrl()).toBe('/version.json');
  });
});
