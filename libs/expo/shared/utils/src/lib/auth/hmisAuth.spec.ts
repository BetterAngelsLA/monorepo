import NitroCookies from 'react-native-nitro-cookies';
import {
  __resetDependencies,
  __setDependencies,
  getHmisApiUrl,
  getHmisAuthToken,
  storeHmisDomain,
} from './hmisAuth';

describe('hmisAuth', () => {
  const mockStorage = {
    get: jest.fn(),
    set: jest.fn(),
    remove: jest.fn(),
  };

  const mockGetCookies = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    __setDependencies({
      storage: mockStorage,
      getCookies: mockGetCookies,
    });
  });

  afterEach(() => {
    __resetDependencies();
  });

  describe('storeHmisDomain', () => {
    it('stores the domain in storage', () => {
      storeHmisDomain('https://example.com');
      expect(mockStorage.set).toHaveBeenCalledWith(
        'hmis_domain',
        'https://example.com'
      );
    });
  });

  describe('getHmisAuthToken', () => {
    it('returns auth token from cookies when domain is set', async () => {
      mockStorage.get.mockReturnValue('https://example.com');
      mockGetCookies.mockResolvedValue({
        auth_token: { value: 'token123' },
      });

      const token = await getHmisAuthToken();

      expect(mockStorage.get).toHaveBeenCalledWith('hmis_domain');
      expect(mockGetCookies).toHaveBeenCalledWith('https://example.com');
      expect(token).toBe('token123');
    });

    it('returns null when domain is not set', async () => {
      mockStorage.get.mockReturnValue(null);

      const token = await getHmisAuthToken();

      expect(token).toBeNull();
      expect(mockGetCookies).not.toHaveBeenCalled();
    });

    it('returns null when cookie does not exist', async () => {
      mockStorage.get.mockReturnValue('https://example.com');
      mockGetCookies.mockResolvedValue({});

      const token = await getHmisAuthToken();

      expect(token).toBeNull();
    });

    it('returns null when getCookies throws error', async () => {
      mockStorage.get.mockReturnValue('https://example.com');
      mockGetCookies.mockRejectedValue(new Error('Network error'));

      const token = await getHmisAuthToken();

      expect(token).toBeNull();
    });
  });

  describe('getHmisApiUrl', () => {
    it('returns api_url from cookies when domain is set', async () => {
      mockStorage.get.mockReturnValue('https://example.com');
      mockGetCookies.mockResolvedValue({
        api_url: { value: 'https://api.example.com' },
      });

      const url = await getHmisApiUrl();

      expect(mockStorage.get).toHaveBeenCalledWith('hmis_domain');
      expect(mockGetCookies).toHaveBeenCalledWith('https://example.com');
      expect(url).toBe('https://api.example.com');
    });

    it('decodes percent-encoded api_url values', async () => {
      mockStorage.get.mockReturnValue('https://example.com');
      mockGetCookies.mockResolvedValue({
        api_url: { value: 'https%3A%2F%2Fapi.example.com%2F' },
      });

      const url = await getHmisApiUrl();

      expect(url).toBe('https://api.example.com');
    });

    it('trims whitespace and trailing slashes', async () => {
      mockStorage.get.mockReturnValue('https://example.com');
      mockGetCookies.mockResolvedValue({
        api_url: { value: '  https://api.example.com///  ' },
      });

      const url = await getHmisApiUrl();

      expect(url).toBe('https://api.example.com');
    });

    it('returns null when value is empty after cleanup', async () => {
      mockStorage.get.mockReturnValue('https://example.com');
      mockGetCookies.mockResolvedValue({
        api_url: { value: '   ///   ' },
      });

      const url = await getHmisApiUrl();

      expect(url).toBeNull();
    });

    it('returns null when domain is not set', async () => {
      mockStorage.get.mockReturnValue(null);

      const url = await getHmisApiUrl();

      expect(url).toBeNull();
      expect(mockGetCookies).not.toHaveBeenCalled();
    });

    it('returns null when cookie does not exist', async () => {
      mockStorage.get.mockReturnValue('https://example.com');
      mockGetCookies.mockResolvedValue({});

      const url = await getHmisApiUrl();

      expect(url).toBeNull();
    });
  });

  describe('production wiring (no DI overrides)', () => {
    beforeEach(() => {
      __resetDependencies();
      jest.clearAllMocks();
    });

    it('stores domain and retrieves auth token via NitroCookies + MMKV mock', async () => {
      // Store domain using default storage
      storeHmisDomain('https://example.com');

      // Mock cookies returned by NitroCookies
      (NitroCookies as any).get.mockResolvedValue({
        auth_token: { value: 'tokenProd' },
      });

      const token = await getHmisAuthToken();
      expect(token).toBe('tokenProd');
      expect((NitroCookies as any).get).toHaveBeenCalledWith(
        'https://example.com'
      );
    });

    it('retrieves api_url via NitroCookies + MMKV mock', async () => {
      storeHmisDomain('https://example.com');
      (NitroCookies as any).get.mockResolvedValue({
        api_url: { value: 'https://api.example.com' },
      });

      const url = await getHmisApiUrl();
      expect(url).toBe('https://api.example.com');
      expect((NitroCookies as any).get).toHaveBeenCalledWith(
        'https://example.com'
      );
    });
  });
});
