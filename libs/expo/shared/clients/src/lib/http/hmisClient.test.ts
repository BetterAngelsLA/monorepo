import { createHmisClient } from './hmisClient';
import { HmisError } from './hmisTypes';

// Mock the utils module to avoid expo dependencies in tests
jest.mock('@monorepo/expo/shared/utils', () => ({
  CSRF_COOKIE_NAME: 'csrftoken',
  CSRF_HEADER_NAME: 'X-CSRFToken',
  CSRF_LOGIN_PATH: '/api/login/',
  HMIS_AUTH_COOKIE_NAME: 'auth_token',
  HMIS_TOKEN_HEADER_NAME: 'X-HMIS-Token',
}));

// Mock AsyncStorage before importing any modules that use it
const mockGetItem = jest.fn();
const mockSetItem = jest.fn();

jest.mock('@react-native-async-storage/async-storage', () => {
  return {
    __esModule: true,
    default: {
      getItem: (key: string) => mockGetItem(key),
      setItem: (key: string, value: string) => mockSetItem(key, value),
    },
  };
});

// Mock NitroCookies
const mockGet = jest.fn();
const mockSetFromResponse = jest.fn();

jest.mock('react-native-nitro-cookies', () => {
  return {
    __esModule: true,
    default: {
      get: (url: string) => mockGet(url),
      setFromResponse: (url: string, setCookie: string) =>
        mockSetFromResponse(url, setCookie),
    },
  };
});

const mockFetch = jest.fn();

// Provide a global fetch mock
(global as typeof globalThis).fetch = mockFetch;

const jsonHeaders = new Headers({ 'content-type': 'application/json' });

describe('HmisClient', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Mock AsyncStorage to return the HMIS API URL
    mockGetItem.mockImplementation((key) => {
      if (key === 'hmis_api_url')
        return Promise.resolve('https://hmis.example.com');
      return Promise.resolve(null);
    });

    // Mock NitroCookies to return the auth token
    mockGet.mockResolvedValue({
      auth_token: { value: 'mock-token' },
    });
  });

  it('sends bearer auth and user agent', async () => {
    const hmisClient = createHmisClient();
    mockFetch.mockResolvedValueOnce({
      ok: true,
      headers: jsonHeaders,
      text: async () => JSON.stringify({ ok: true }),
      json: async () => ({ ok: true }),
    });

    const result = await hmisClient.get('/current-user', { fields: 'id' });

    expect(result).toEqual({ ok: true });
    expect(mockFetch).toHaveBeenCalledTimes(1);

    const [url, options] = mockFetch.mock.calls[0];
    expect(url).toBe('https://hmis.example.com/current-user?fields=id');
    const headers = options.headers as Headers;
    expect(headers.get('Authorization')).toBe('Bearer mock-token');
    expect(headers.get('User-Agent')).toBeTruthy();
    expect(headers.get('X-Requested-With')).toBe('XMLHttpRequest');
  });

  it('throws HmisError with status code on 401', async () => {
    const hmisClient = createHmisClient();
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 401,
      statusText: 'Unauthorized',
      headers: jsonHeaders,
      text: async () => JSON.stringify({ detail: 'unauthorized' }),
      json: async () => ({ detail: 'unauthorized' }),
    });

    await expect(hmisClient.get('/current-user')).rejects.toMatchObject({
      status: 401,
      message: 'Unauthorized - please log in',
    });
  });

  it('formats validation errors on 422', async () => {
    const hmisClient = createHmisClient();
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 422,
      statusText: 'Unprocessable Entity',
      headers: jsonHeaders,
      text: async () =>
        JSON.stringify({ messages: { foo: 'invalid', bar: 'missing' } }),
      json: async () => ({ messages: { foo: 'invalid', bar: 'missing' } }),
    });

    await expect(hmisClient.get('/current-user')).rejects.toThrow(
      new HmisError('Validation errors: foo: invalid, bar: missing', 422, {
        messages: { foo: 'invalid', bar: 'missing' },
      })
    );
  });

  it('returns text when not json', async () => {
    const hmisClient = createHmisClient();
    mockFetch.mockResolvedValueOnce({
      ok: true,
      headers: new Headers({ 'content-type': 'text/plain' }),
      text: async () => 'plain text',
    });

    const result = await hmisClient.get('/ping');
    expect(result).toBe('plain text');
  });

  it('handles double-encoded JSON responses', async () => {
    const hmisClient = createHmisClient();
    const innerJson = { success: true, data: { content: 'uploaded' } };
    const doubleEncoded = JSON.stringify(JSON.stringify(innerJson));

    mockFetch.mockResolvedValueOnce({
      ok: true,
      headers: jsonHeaders,
      text: async () => doubleEncoded,
    });

    const result = await hmisClient.get('/photo/upload');
    expect(result).toEqual(innerJson);
  });

  describe('uploadClientFile', () => {
    it('uploads a file with correct structure', async () => {
      const hmisClient = createHmisClient();
      const mockResponse = {
        id: 37,
        ref_client: 404,
        fileId: 47,
        categoryId: 12,
        clientId: '68998C256',
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        headers: jsonHeaders,
        text: async () => JSON.stringify(mockResponse),
        json: async () => mockResponse,
      });

      const result = await hmisClient.uploadClientFile(
        '68998C256',
        {
          content: 'VGVzdCBjb250ZW50', // Base64 "Test content"
          name: 'test.txt',
          mimeType: 'text/plain',
        },
        12, // categoryId
        89 // fileNameId
      );

      expect(result).toEqual(mockResponse);
      expect(mockFetch).toHaveBeenCalledTimes(1);

      const [url, options] = mockFetch.mock.calls[0];
      expect(url).toBe(
        'https://hmis.example.com/clients/68998C256/client-files'
      );
      expect(options.method).toBe('POST');
      const headers = options.headers as Headers;
      expect(headers.get('Content-Type')).toBe('application/json');

      const body = JSON.parse(options.body);
      expect(body).toEqual({
        clientFile: {
          ref_category: 12,
          ref_file_name: 89,
          private: null,
        },
        base64_file_content: 'data:text/plain;base64,VGVzdCBjb250ZW50',
        file_name: 'test.txt',
      });
    });

    it('throws error for invalid file type', async () => {
      const hmisClient = createHmisClient();
      await expect(
        hmisClient.uploadClientFile(
          '68998C256',
          {
            content: 'VGVzdCBjb250ZW50',
            name: 'test.mov',
            mimeType: 'video/quicktime' as any,
          },
          12,
          89
        )
      ).rejects.toThrow('File type "video/quicktime" is not allowed');
    });

    it('supports private flag', async () => {
      const hmisClient = createHmisClient();
      mockFetch.mockResolvedValueOnce({
        ok: true,
        headers: jsonHeaders,
        text: async () => JSON.stringify({ id: 37 }),
        json: async () => ({ id: 37 }),
      });

      await hmisClient.uploadClientFile(
        '68998C256',
        {
          content: 'VGVzdCBjb250ZW50',
          name: 'private.pdf',
          mimeType: 'application/pdf',
        },
        12,
        89,
        true // isPrivate
      );

      const [, options] = mockFetch.mock.calls[0];
      const body = JSON.parse(options.body);
      expect(body.clientFile.private).toBe(true);
    });
  });
});
