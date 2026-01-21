import { hmisClient } from './hmisClient';
import { HmisError } from './hmisTypes';

jest.mock('@monorepo/expo/shared/utils', () => ({
  getHmisAuthToken: jest.fn().mockResolvedValue('mock-token'),
  getHmisApiUrl: jest.fn().mockResolvedValue('https://hmis.example.com'),
}));

const mockFetch = jest.fn();

// Provide a global fetch mock
(global as typeof globalThis).fetch = mockFetch;

const jsonHeaders = new Headers({ 'content-type': 'application/json' });

describe('HmisClient', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('sends bearer auth, user agent, and includes credentials', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      headers: jsonHeaders,
      json: async () => ({ ok: true }),
    });

    const result = await hmisClient.get('/current-user', { fields: 'id' });

    expect(result).toEqual({ ok: true });
    expect(mockFetch).toHaveBeenCalledTimes(1);

    const [url, options] = mockFetch.mock.calls[0];
    expect(url).toBe('https://hmis.example.com/current-user?fields=id');
    expect(options.credentials).toBe('include');
    expect(options.headers['Authorization']).toBe('Bearer mock-token');
    expect(options.headers['User-Agent']).toBeTruthy();
    expect(options.headers['X-Requested-With']).toBe('XMLHttpRequest');
  });

  it('throws HmisError with status code on 401', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 401,
      statusText: 'Unauthorized',
      headers: jsonHeaders,
      json: async () => ({ detail: 'unauthorized' }),
    });

    await expect(hmisClient.get('/current-user')).rejects.toMatchObject({
      status: 401,
      message: 'Unauthorized - please log in',
    });
  });

  it('formats validation errors on 422', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 422,
      statusText: 'Unprocessable Entity',
      headers: jsonHeaders,
      json: async () => ({ messages: { foo: 'invalid', bar: 'missing' } }),
    });

    await expect(hmisClient.get('/current-user')).rejects.toThrow(
      new HmisError('Validation errors: foo: invalid, bar: missing', 422, {
        messages: { foo: 'invalid', bar: 'missing' },
      })
    );
  });

  it('returns text when not json', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      headers: new Headers({ 'content-type': 'text/plain' }),
      text: async () => 'plain text',
    });

    const result = await hmisClient.get('/ping');
    expect(result).toBe('plain text');
  });
});
