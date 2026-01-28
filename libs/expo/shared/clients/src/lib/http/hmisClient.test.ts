import { createHmisClient } from './hmisClient';
import { HmisError } from './hmisTypes';

const mockGetCookieValue = jest.fn();

jest.mock('@monorepo/expo/shared/utils', () => ({
  authStorage: {
    getCookieValue: mockGetCookieValue,
  },
}));

const mockFetch = jest.fn();

// Provide a global fetch mock
(global as typeof globalThis).fetch = mockFetch;

const jsonHeaders = new Headers({ 'content-type': 'application/json' });

describe('HmisClient', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetCookieValue.mockImplementation((name) => {
      if (name === 'auth_token') return 'mock-token';
      if (name === 'api_url') return 'https://hmis.example.com';
      return null;
    });
  });

  it('sends bearer auth and user agent', async () => {
    const hmisClient = createHmisClient();
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
    expect(options.headers['Authorization']).toBe('Bearer mock-token');
    expect(options.headers['User-Agent']).toBeTruthy();
    expect(options.headers['X-Requested-With']).toBe('XMLHttpRequest');
  });

  it('throws HmisError with status code on 401', async () => {
    const hmisClient = createHmisClient();
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
    const hmisClient = createHmisClient();
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
    const hmisClient = createHmisClient();
    mockFetch.mockResolvedValueOnce({
      ok: true,
      headers: new Headers({ 'content-type': 'text/plain' }),
      text: async () => 'plain text',
    });

    const result = await hmisClient.get('/ping');
    expect(result).toBe('plain text');
  });

  describe('uploadClientFile', () => {
    it('uploads a file with correct structure', async () => {
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
      expect(options.headers['Content-Type']).toBe('application/json');

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
      mockFetch.mockResolvedValueOnce({
        ok: true,
        headers: jsonHeaders,
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
