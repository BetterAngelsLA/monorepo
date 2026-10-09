import { configurePlacesProxy, GooglePlacesClient } from './GooglePlacesClient';

/** Minimal stand-in for a fetch Response. */
const fakeResponse = (body: unknown) =>
  Promise.resolve({
    ok: true,
    status: 200,
    headers: new Headers(),
    json: async () => body,
  } as unknown as Response);

describe('GooglePlacesClient transport', () => {
  const calls: Array<{ url: string; init?: RequestInit }> = [];
  const recordingFetch = ((url: unknown, init?: RequestInit) => {
    calls.push({ url: String(url), init });
    return fakeResponse({ suggestions: [], results: [] });
  }) as unknown as typeof fetch;

  // Captured before any test swaps it, so `afterEach` can put the environment
  // back rather than leaking a stub into whatever spec runs next.
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    calls.length = 0;
    configurePlacesProxy(null);
    (globalThis as { fetch: typeof fetch }).fetch = recordingFetch;
  });

  afterEach(() => {
    configurePlacesProxy(null);
    (globalThis as { fetch: typeof fetch }).fetch = originalFetch;
  });

  it('calls Google directly and sends the key when no proxy is configured', async () => {
    const client = new GooglePlacesClient('test-key');

    await client.autocomplete('1600 Amphitheatre');

    expect(calls).toHaveLength(1);
    expect(calls[0].url).toBe(
      'https://places.googleapis.com/v1/places:autocomplete',
    );
    const headers = new Headers(calls[0].init?.headers);
    expect(headers.get('X-Goog-Api-Key')).toBe('test-key');
  });

  it('routes autocomplete through the proxy, with the trailing slash and no key', async () => {
    configurePlacesProxy({
      apiUrl: 'https://api.example.test',
      fetch: recordingFetch,
    });
    const client = new GooglePlacesClient('test-key');

    await client.autocomplete('1600 Amphitheatre');

    // The proxy route is `places/v1/<path>/` — without the trailing slash Django
    // redirects the POST and the body is lost.
    expect(calls[0].url).toBe(
      'https://api.example.test/proxy/places/v1/places:autocomplete/',
    );
    const headers = new Headers(calls[0].init?.headers);
    // The backend holds the key; a browser must never send one.
    expect(headers.get('X-Goog-Api-Key')).toBeNull();
    // The proxy forwards this, so ours has to survive.
    expect(headers.get('X-Goog-FieldMask')).toContain(
      'suggestions.placePrediction.placeId',
    );
  });

  it('routes place details through the proxy', async () => {
    configurePlacesProxy({
      apiUrl: 'https://api.example.test',
      fetch: recordingFetch,
    });
    const client = new GooglePlacesClient('test-key');

    await client.getDetails('ChIJabc');

    expect(calls[0].url).toBe(
      'https://api.example.test/proxy/places/v1/places/ChIJabc/',
    );
  });

  it('drops the key from the proxied geocode URL and keeps it direct otherwise', async () => {
    const client = new GooglePlacesClient('test-key');

    await client.reverseGeocode(34.05, -118.24);
    expect(calls[0].url).toContain(
      'https://maps.googleapis.com/maps/api/geocode/json?',
    );
    expect(calls[0].url).toContain('key=test-key');

    calls.length = 0;
    configurePlacesProxy({
      apiUrl: 'https://api.example.test',
      fetch: recordingFetch,
    });

    await client.reverseGeocode(34.05, -118.24);
    expect(calls[0].url).toContain(
      'https://api.example.test/proxy/maps/api/geocode/json/?',
    );
    expect(calls[0].url).not.toContain('key=');
    expect(calls[0].url).toContain('latlng=34.05%2C-118.24');
  });

  const respondWith = (body: unknown) =>
    ((url: unknown, init?: RequestInit) => {
      calls.push({ url: String(url), init });
      return fakeResponse(body);
    }) as unknown as typeof fetch;

  it('throws when the geocoder reports a failure with HTTP 200', async () => {
    // The Geocoding API answers REQUEST_DENIED / OVER_QUERY_LIMIT with 200 and a
    // `status` field. Previously that fell through to the coordinate fallback and
    // looked like a successful reverse geocode of the raw lat/lng.
    (globalThis as { fetch: typeof fetch }).fetch = respondWith({
      status: 'REQUEST_DENIED',
      error_message: 'API keys with referer restrictions cannot be used',
      results: [],
    });

    const client = new GooglePlacesClient('test-key');

    await expect(client.reverseGeocode(34.05, -118.24)).rejects.toThrow(
      /REQUEST_DENIED/,
    );
  });

  it('still falls back to the coordinates when there are genuinely no results', async () => {
    (globalThis as { fetch: typeof fetch }).fetch = respondWith({
      status: 'ZERO_RESULTS',
      results: [],
    });

    const client = new GooglePlacesClient('test-key');
    const result = await client.reverseGeocode(34.05, -118.24);

    expect(result.shortAddress).toBe('34.05000, -118.24000');
  });

  it('tolerates a response with no status field at all', async () => {
    // A proxy that reshapes the body must not make every geocode throw.
    (globalThis as { fetch: typeof fetch }).fetch = respondWith({
      results: [{ formatted_address: '123 Main St, Los Angeles, CA' }],
    });

    const client = new GooglePlacesClient('test-key');
    const result = await client.reverseGeocode(34.05, -118.24);

    expect(result.shortAddress).toBe('123 Main St');
  });
});
