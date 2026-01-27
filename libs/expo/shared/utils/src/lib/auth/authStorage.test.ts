import { authStorage } from './authStorage';
import { CSRF_COOKIE_NAME, SESSION_COOKIE_NAME } from './constants';

jest.mock('expo-crypto', () => ({
  randomUUID: () => 'test-uuid-key',
}));

jest.mock('expo-secure-store', () => ({
  getItemAsync: () => Promise.resolve(null),
  setItemAsync: () => Promise.resolve(),
  deleteItemAsync: () => Promise.resolve(),
}));

const mockStorage = new Map<string, string>();

jest.mock('react-native-mmkv', () => ({
  createMMKV: () => ({
    set: (key: string, value: string) => mockStorage.set(key, value),
    getString: (key: string) => mockStorage.get(key) ?? null,
    delete: (key: string) => mockStorage.delete(key),
    clearAll: () => mockStorage.clear(),
  }),
}));

describe('AuthStorage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockStorage.clear();
  });

  describe('Cookie operations', () => {
    it('stores and retrieves cookie values', () => {
      const envKey = 'https://api.example.com';

      expect(authStorage.getCookieValue(envKey, CSRF_COOKIE_NAME)).toBeNull();

      authStorage.updateFromSetCookieHeaders(envKey, {
        getSetCookie: () => [
          'csrftoken=abc123; Path=/; HttpOnly',
          'sessionid=xyz789; Path=/; HttpOnly',
        ],
      });

      expect(authStorage.getCookieValue(envKey, CSRF_COOKIE_NAME)).toBe(
        'abc123'
      );
      expect(authStorage.getCookieValue(envKey, SESSION_COOKIE_NAME)).toBe(
        'xyz789'
      );
    });

    it('generates cookie header for requests', () => {
      const envKey = 'https://api.example.com';

      authStorage.updateFromSetCookieHeaders(envKey, {
        getSetCookie: () => [
          'csrftoken=token1; Path=/',
          'sessionid=session1; Path=/',
        ],
      });

      const result = authStorage.getCookiesForRequest(envKey);

      expect(result.cookieHeader).toBe('csrftoken=token1; sessionid=session1');
      expect(result.csrfToken).toBe('token1');
    });

    it('returns null cookie header when no cookies stored', () => {
      const result = authStorage.getCookiesForRequest('https://empty.com');

      expect(result.cookieHeader).toBeNull();
      expect(result.csrfToken).toBeNull();
    });

    it('handles string set-cookie header', () => {
      const envKey = 'https://api.example.com';

      authStorage.updateFromSetCookieHeaders(envKey, {
        get: (name: string) =>
          name === 'set-cookie'
            ? 'csrftoken=value1; Path=/, sessionid=value2; Path=/'
            : null,
      });

      expect(authStorage.getCookieValue(envKey, CSRF_COOKIE_NAME)).toBe(
        'value1'
      );
      expect(authStorage.getCookieValue(envKey, SESSION_COOKIE_NAME)).toBe(
        'value2'
      );
    });

    it('ignores non-allowed cookies', () => {
      const envKey = 'https://api.example.com';

      authStorage.updateFromSetCookieHeaders(envKey, {
        getSetCookie: () => [
          'csrftoken=allowed; Path=/',
          'random_cookie=ignored; Path=/',
        ],
      });

      const result = authStorage.getCookiesForRequest(envKey);
      expect(result.cookieHeader).toBe('csrftoken=allowed');
    });

    it('handles missing set-cookie headers', () => {
      const envKey = 'https://api.example.com';

      authStorage.updateFromSetCookieHeaders(envKey, { get: () => null });

      expect(authStorage.getCookieValue(envKey, CSRF_COOKIE_NAME)).toBeNull();
    });
  });

  describe('HMIS token operations', () => {
    it('stores and retrieves HMIS auth token', () => {
      expect(authStorage.getHmisAuthToken()).toBeNull();

      authStorage.storeHmisAuthToken('test-hmis-token');

      expect(authStorage.getHmisAuthToken()).toBe('test-hmis-token');
    });

    it('overwrites existing HMIS token', () => {
      authStorage.storeHmisAuthToken('token1');
      authStorage.storeHmisAuthToken('token2');

      expect(authStorage.getHmisAuthToken()).toBe('token2');
    });
  });

  describe('HMIS API URL operations', () => {
    it('stores and retrieves HMIS API URL', () => {
      expect(authStorage.getHmisApiUrl()).toBeNull();

      authStorage.storeHmisApiUrl('https://hmis.example.com');

      expect(authStorage.getHmisApiUrl()).toBe('https://hmis.example.com');
    });

    it('overwrites existing HMIS API URL', () => {
      authStorage.storeHmisApiUrl('https://url1.com');
      authStorage.storeHmisApiUrl('https://url2.com');

      expect(authStorage.getHmisApiUrl()).toBe('https://url2.com');
    });
  });

  describe('HMIS token expiration', () => {
    it('returns true when no token exists', () => {
      expect(authStorage.isHmisTokenExpired()).toBe(true);
    });

    it('returns true for malformed JWT', () => {
      authStorage.storeHmisAuthToken('not-a-valid-jwt');

      expect(authStorage.isHmisTokenExpired()).toBe(true);
    });

    it('returns true when token has no exp claim', () => {
      const tokenNoExp =
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c2VyIn0.test';
      authStorage.storeHmisAuthToken(tokenNoExp);

      expect(authStorage.isHmisTokenExpired()).toBe(true);
    });

    it('returns true for expired token', () => {
      const expiredToken =
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjEwMDAwMDAwMDB9.test';
      authStorage.storeHmisAuthToken(expiredToken);

      expect(authStorage.isHmisTokenExpired()).toBe(true);
    });

    it('returns false for valid non-expired token', () => {
      const validToken =
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjk5OTk5OTk5OTl9.test';
      authStorage.storeHmisAuthToken(validToken);

      expect(authStorage.isHmisTokenExpired()).toBe(false);
    });
  });
});
