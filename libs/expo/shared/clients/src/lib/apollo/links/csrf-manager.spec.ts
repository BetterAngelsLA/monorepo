import { getItem, setItem } from '@monorepo/expo/shared/utils';
import { CSRF_COOKIE_NAME } from './constants';
import { csrfManager } from './csrf-manager';

jest.mock('@monorepo/expo/shared/utils', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
}));

const API_URL1 = 'https://api.example.com';
const API_URL2 = 'https://another.example.com';
const TOKEN1 = 'token1';
const TOKEN2 = 'token2';

const expectedKey1 = `${CSRF_COOKIE_NAME}_https___api_example_com`;
const expectedKey2 = `${CSRF_COOKIE_NAME}_https___another_example_com`;

const COOKIE_HEADER1 = `${CSRF_COOKIE_NAME}=${TOKEN1};`;
const COOKIE_HEADER2 = `${CSRF_COOKIE_NAME}=${TOKEN2};`;

describe('CSRFTokenManager', () => {
  // Suppress console.error for the duration of these tests.
  beforeAll(() => {
    jest.spyOn(console, 'error').mockImplementation(() => {
      /* noop */
    });
  });

  afterAll(() => {
    (console.error as jest.Mock).mockRestore();
  });

  beforeEach(async () => {
    jest.resetAllMocks();
    // Clear tokens for both API URLs.
    await csrfManager.clearToken(API_URL1);
    await csrfManager.clearToken(API_URL2);
    // Clear mocks so that any calls during clearToken are not counted.
    jest.clearAllMocks();
  });

  it('should return token from storage if available', async () => {
    (getItem as jest.Mock).mockImplementation((key: string) => {
      if (key === expectedKey1) {
        return Promise.resolve(TOKEN1);
      }
      return Promise.resolve(undefined);
    });
    const token = await csrfManager.getToken(API_URL1);
    expect(token).toEqual(TOKEN1);
    expect(getItem).toHaveBeenCalledWith(expectedKey1);
  });

  it('should fetch token using customFetch if not in storage', async () => {
    (getItem as jest.Mock).mockResolvedValue(undefined);
    const mockFetch = jest.fn().mockResolvedValue({
      headers: new Headers({ 'Set-Cookie': COOKIE_HEADER1 }),
    });
    const token = await csrfManager.getToken(API_URL1, mockFetch);
    expect(token).toEqual(TOKEN1);
    expect(setItem).toHaveBeenCalledWith(expectedKey1, TOKEN1);
    // Subsequent calls return the cached token.
    const token2 = await csrfManager.getToken(API_URL1);
    expect(token2).toEqual(TOKEN1);
  });

  it('should store tokens separately for different API URLs', async () => {
    (getItem as jest.Mock).mockImplementation((key: string) => {
      if (key === expectedKey1) return Promise.resolve(TOKEN1);
      if (key === expectedKey2) return Promise.resolve(TOKEN2);
      return Promise.resolve(undefined);
    });
    const token1 = await csrfManager.getToken(API_URL1);
    const token2 = await csrfManager.getToken(API_URL2);
    expect(token1).toEqual(TOKEN1);
    expect(token2).toEqual(TOKEN2);
  });

  it('should deduplicate concurrent requests', async () => {
    (getItem as jest.Mock).mockResolvedValue(undefined);
    let fetchCallCount = 0;
    const mockFetch = jest.fn().mockImplementation(() => {
      fetchCallCount++;
      return Promise.resolve({
        headers: new Headers({ 'Set-Cookie': COOKIE_HEADER1 }),
      });
    });
    const [token1, token2] = await Promise.all([
      csrfManager.getToken(API_URL1, mockFetch),
      csrfManager.getToken(API_URL1, mockFetch),
    ]);
    expect(token1).toEqual(TOKEN1);
    expect(token2).toEqual(TOKEN1);
    expect(fetchCallCount).toBe(1);
  });

  it('should update token from cookies if valid', async () => {
    await csrfManager.updateTokenFromCookies(API_URL1, COOKIE_HEADER2);
    expect(setItem).toHaveBeenCalledWith(expectedKey1, TOKEN2);
    (getItem as jest.Mock).mockResolvedValue(TOKEN2);
    const token = await csrfManager.getToken(API_URL1);
    expect(token).toEqual(TOKEN2);
  });

  it('should not update token if cookie header is absent or empty', async () => {
    await csrfManager.updateTokenFromCookies(API_URL1, '');
    // Expect that setItem is not called since no token is extracted.
    expect(setItem).not.toHaveBeenCalled();
  });

  it('should clear token for a specific API URL', async () => {
    (getItem as jest.Mock).mockResolvedValue(TOKEN1);
    await csrfManager.getToken(API_URL1);
    await csrfManager.clearToken(API_URL1);
    expect(setItem).toHaveBeenCalledWith(expectedKey1, '');
    (getItem as jest.Mock).mockResolvedValue(undefined);
    const token = await csrfManager.getToken(API_URL1);
    expect(token).toBeNull();
  });
});
