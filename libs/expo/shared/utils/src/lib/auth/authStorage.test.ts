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
    it('stores and retrieves cookie values by domain', () => {
      authStorage.updateFromSetCookieHeaders({
        getSetCookie: () => [
          'csrftoken=abc123; Path=/; Domain=backend.com; HttpOnly',
          'sessionid=xyz789; Path=/; Domain=backend.com; HttpOnly',
        ],
      });

      expect(authStorage.getCookieValue(CSRF_COOKIE_NAME, 'backend.com')).toBe(
        'abc123'
      );
      expect(
        authStorage.getCookieValue(SESSION_COOKIE_NAME, 'backend.com')
      ).toBe('xyz789');
    });

    it('generates cookie header for requests with all domains', () => {
      authStorage.updateFromSetCookieHeaders({
        getSetCookie: () => [
          'csrftoken=token1; Path=/; Domain=backend.com',
          'sessionid=session1; Path=/; Domain=backend.com',
          'auth_token=hmis_token; Path=/; Domain=hmis.example.com',
        ],
      });

      const result = authStorage.getCookiesForRequest();

      expect(result.cookieHeader).toContain('csrftoken=token1');
      expect(result.cookieHeader).toContain('sessionid=session1');
      expect(result.cookieHeader).toContain('auth_token=hmis_token');
      expect(result.csrfToken).toBe('token1');
    });

    it('returns null cookie header when no cookies stored', () => {
      mockStorage.clear();

      const result = authStorage.getCookiesForRequest();

      expect(result.cookieHeader).toBeNull();
      expect(result.csrfToken).toBeNull();
    });

    it('handles cookies without domain attribute', () => {
      authStorage.updateFromSetCookieHeaders({
        get: (name: string) =>
          name === 'set-cookie'
            ? 'csrftoken=value1; Path=/, sessionid=value2; Path=/'
            : null,
      });

      expect(authStorage.getCookieValue(CSRF_COOKIE_NAME, 'default')).toBe(
        'value1'
      );
      expect(authStorage.getCookieValue(SESSION_COOKIE_NAME, 'default')).toBe(
        'value2'
      );
    });

    it('stores all cookies without whitelist', () => {
      authStorage.updateFromSetCookieHeaders({
        getSetCookie: () => [
          'csrftoken=allowed; Path=/; Domain=backend.com',
          'random_cookie=also_stored; Path=/; Domain=backend.com',
        ],
      });

      const result = authStorage.getCookiesForRequest();
      expect(result.cookieHeader).toContain('csrftoken=allowed');
      expect(result.cookieHeader).toContain('random_cookie=also_stored');
    });

    it('handles missing set-cookie headers', () => {
      authStorage.updateFromSetCookieHeaders({ get: () => null });

      expect(
        authStorage.getCookieValue(CSRF_COOKIE_NAME, 'default')
      ).toBeNull();
    });
  });

  describe('HMIS token operations', () => {
    it('stores and retrieves HMIS auth token via cookies with domain', () => {
      // Simulate Set-Cookie response from HMIS
      const headers = {
        getSetCookie: () => [
          'auth_token=test-hmis-token; Path=/; Domain=hmis.example.com; HttpOnly',
        ],
      };
      authStorage.updateFromSetCookieHeaders(headers);

      expect(authStorage.getCookieValue('auth_token', 'hmis.example.com')).toBe(
        'test-hmis-token'
      );
    });

    it('overwrites existing HMIS token for same domain', () => {
      const headers1 = {
        getSetCookie: () => ['auth_token=token1; Domain=hmis.example.com'],
      };
      const headers2 = {
        getSetCookie: () => ['auth_token=token2; Domain=hmis.example.com'],
      };

      authStorage.updateFromSetCookieHeaders(headers1);
      authStorage.updateFromSetCookieHeaders(headers2);

      expect(authStorage.getCookieValue('auth_token', 'hmis.example.com')).toBe(
        'token2'
      );
    });

    it('keeps separate tokens for different domains', () => {
      const headers1 = {
        getSetCookie: () => ['auth_token=token1; Domain=hmis1.com'],
      };
      const headers2 = {
        getSetCookie: () => ['auth_token=token2; Domain=hmis2.com'],
      };

      authStorage.updateFromSetCookieHeaders(headers1);
      authStorage.updateFromSetCookieHeaders(headers2);

      expect(authStorage.getCookieValue('auth_token', 'hmis1.com')).toBe(
        'token1'
      );
      expect(authStorage.getCookieValue('auth_token', 'hmis2.com')).toBe(
        'token2'
      );
    });
  });

  describe('HMIS API URL operations', () => {
    it('stores and retrieves HMIS API URL via cookies with domain', () => {
      const headers = {
        getSetCookie: () => [
          'api_url=https%3A%2F%2Fhmis.example.com; Domain=hmis.example.com',
        ],
      };
      authStorage.updateFromSetCookieHeaders(headers);

      expect(authStorage.getCookieValue('api_url', 'hmis.example.com')).toBe(
        'https%3A%2F%2Fhmis.example.com'
      );
    });

    it('overwrites existing HMIS API URL', () => {
      const headers1 = {
        getSetCookie: () => [
          'api_url=https%3A%2F%2Furl1.com; Domain=hmis.example.com',
        ],
      };
      const headers2 = {
        getSetCookie: () => [
          'api_url=https%3A%2F%2Furl2.com; Domain=hmis.example.com',
        ],
      };

      authStorage.updateFromSetCookieHeaders(headers1);
      authStorage.updateFromSetCookieHeaders(headers2);

      expect(authStorage.getCookieValue('api_url', 'hmis.example.com')).toBe(
        'https%3A%2F%2Furl2.com'
      );
    });
  });

  describe('HMIS token expiration', () => {
    const hmisDomain = 'hmis.example.com';

    it('returns true when no token exists', () => {
      expect(authStorage.isHmisTokenExpired(hmisDomain)).toBe(true);
    });

    it('returns true for malformed JWT', () => {
      const headers = {
        getSetCookie: () => [
          `auth_token=not-a-valid-jwt; Domain=${hmisDomain}`,
        ],
      };
      authStorage.updateFromSetCookieHeaders(headers);

      expect(authStorage.isHmisTokenExpired(hmisDomain)).toBe(true);
    });

    it('returns true when token has no exp claim', () => {
      const tokenNoExp =
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c2VyIn0.test';
      const headers = {
        getSetCookie: () => [`auth_token=${tokenNoExp}; Domain=${hmisDomain}`],
      };
      authStorage.updateFromSetCookieHeaders(headers);

      expect(authStorage.isHmisTokenExpired(hmisDomain)).toBe(true);
    });

    it('returns true for expired token', () => {
      const expiredToken =
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjEwMDAwMDAwMDB9.test';
      const headers = {
        getSetCookie: () => [
          `auth_token=${expiredToken}; Domain=${hmisDomain}`,
        ],
      };
      authStorage.updateFromSetCookieHeaders(headers);

      expect(authStorage.isHmisTokenExpired(hmisDomain)).toBe(true);
    });

    it('returns false for valid non-expired token', () => {
      const validToken =
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjk5OTk5OTk5OTl9.test';
      const headers = {
        getSetCookie: () => [`auth_token=${validToken}; Domain=${hmisDomain}`],
      };
      authStorage.updateFromSetCookieHeaders(headers);

      expect(authStorage.isHmisTokenExpired(hmisDomain)).toBe(false);
    });
  });
});
