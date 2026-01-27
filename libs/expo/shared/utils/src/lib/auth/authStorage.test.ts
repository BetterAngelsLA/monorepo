import { authStorage } from './authStorage';
import { CSRF_COOKIE_NAME, SESSION_COOKIE_NAME } from './constants';

// Mock expo dependencies
jest.mock('expo-crypto', () => ({
  randomUUID: jest.fn(() => 'test-uuid-key'),
}));

jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(() => Promise.resolve(null)),
  setItemAsync: jest.fn(() => Promise.resolve()),
  deleteItemAsync: jest.fn(() => Promise.resolve()),
}));

// Mock MMKV storage with actual storage behavior
const mockStorage = new Map<string, string>();

const mockMMKVInstance = {
  set: jest.fn((key: string, value: string) => {
    mockStorage.set(key, value);
  }),
  getString: jest.fn((key: string) => {
    return mockStorage.get(key) ?? null;
  }),
  delete: jest.fn((key: string) => {
    mockStorage.delete(key);
  }),
  clearAll: jest.fn(() => {
    mockStorage.clear();
  }),
};

jest.mock('react-native-mmkv', () => ({
  createMMKV: jest.fn(() => mockMMKVInstance),
}));

describe('AuthStorage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockStorage.clear();
  });

  describe('Cookie operations', () => {
    it('stores and retrieves cookie values', () => {
      const envKey = 'https://api.example.com';

      // Initially no cookie
      expect(authStorage.getCookieValue(envKey, CSRF_COOKIE_NAME)).toBeNull();

      // Update from headers
      const headers = {
        getSetCookie: () => [
          'csrftoken=abc123; Path=/; HttpOnly',
          'sessionid=xyz789; Path=/; HttpOnly',
        ],
      };

      authStorage.updateFromSetCookieHeaders(envKey, headers);

      // Should retrieve stored values
      expect(authStorage.getCookieValue(envKey, CSRF_COOKIE_NAME)).toBe(
        'abc123'
      );
      expect(authStorage.getCookieValue(envKey, SESSION_COOKIE_NAME)).toBe(
        'xyz789'
      );
    });

    it('generates cookie header for requests', () => {
      const envKey = 'https://api.example.com';

      const headers = {
        getSetCookie: () => [
          'csrftoken=token1; Path=/',
          'sessionid=session1; Path=/',
        ],
      };

      authStorage.updateFromSetCookieHeaders(envKey, headers);

      const result = authStorage.getCookiesForRequest(envKey);

      expect(result.cookieHeader).toBe('csrftoken=token1; sessionid=session1');
      expect(result.csrfToken).toBe('token1');
    });

    it('returns null cookie header when no cookies stored', () => {
      const result = authStorage.getCookiesForRequest('https://empty.com');

      expect(result.cookieHeader).toBeNull();
      expect(result.csrfToken).toBeNull();
    });

    it('handles string set-cookie header (not array)', () => {
      const envKey = 'https://api.example.com';

      const headers = {
        get: (name: string) =>
          name === 'set-cookie'
            ? 'csrftoken=value1; Path=/, sessionid=value2; Path=/'
            : null,
      };

      authStorage.updateFromSetCookieHeaders(envKey, headers);

      expect(authStorage.getCookieValue(envKey, CSRF_COOKIE_NAME)).toBe(
        'value1'
      );
      expect(authStorage.getCookieValue(envKey, SESSION_COOKIE_NAME)).toBe(
        'value2'
      );
    });

    it('ignores non-allowed cookies', () => {
      const envKey = 'https://api.example.com';

      const headers = {
        getSetCookie: () => [
          'csrftoken=allowed; Path=/',
          'random_cookie=ignored; Path=/',
        ],
      };

      authStorage.updateFromSetCookieHeaders(envKey, headers);

      const result = authStorage.getCookiesForRequest(envKey);
      expect(result.cookieHeader).toBe('csrftoken=allowed');
    });

    it('handles missing set-cookie headers gracefully', () => {
      const envKey = 'https://api.example.com';

      const headers = {
        get: () => null,
      };

      // Should not throw
      authStorage.updateFromSetCookieHeaders(envKey, headers);

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
      // JWT with no exp claim: {"sub":"user"}
      const tokenNoExp =
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c2VyIn0.test';
      authStorage.storeHmisAuthToken(tokenNoExp);

      expect(authStorage.isHmisTokenExpired()).toBe(true);
    });

    it('returns true for expired token', () => {
      // JWT with exp in the past: {"exp": 1000000000} (Sep 2001)
      const expiredToken =
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjEwMDAwMDAwMDB9.test';
      authStorage.storeHmisAuthToken(expiredToken);

      expect(authStorage.isHmisTokenExpired()).toBe(true);
    });

    it('returns false for valid non-expired token', () => {
      // JWT with exp far in the future: {"exp": 9999999999} (Nov 2286)
      const validToken =
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjk5OTk5OTk5OTl9.test';
      authStorage.storeHmisAuthToken(validToken);

      expect(authStorage.isHmisTokenExpired()).toBe(false);
    });
  });
});
