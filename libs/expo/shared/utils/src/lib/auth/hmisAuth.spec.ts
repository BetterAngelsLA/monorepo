import {
  __resetDependencies,
  __setDependencies,
  getHmisApiUrl,
  getHmisAuthToken,
  storeHmisApiUrl,
  storeHmisAuthToken,
  clearHmisAuthToken,
} from './hmisAuth';

describe('hmisAuth', () => {
  const mockStorage = {
    get: jest.fn(),
    set: jest.fn(),
    remove: jest.fn(),
  };

  const mockSecureStore = {
    getItemAsync: jest.fn(),
    setItemAsync: jest.fn(),
    deleteItemAsync: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    // Ensure mocks return Promises by default
    mockSecureStore.deleteItemAsync.mockResolvedValue(undefined);
    mockSecureStore.setItemAsync.mockResolvedValue(undefined);
    mockSecureStore.getItemAsync.mockResolvedValue(null);
    __setDependencies({
      storage: mockStorage,
      secureStore: mockSecureStore,
    });
  });

  afterEach(() => {
    __resetDependencies();
  });

  describe('storeHmisApiUrl', () => {
    it('stores the API URL in MMKV storage', () => {
      storeHmisApiUrl('https://api.example.com');
      expect(mockStorage.set).toHaveBeenCalledWith(
        'hmis_api_url',
        'https://api.example.com'
      );
    });
  });

  describe('getHmisApiUrl', () => {
    it('retrieves API URL from MMKV storage', () => {
      mockStorage.get.mockReturnValue('https://api.example.com');
      expect(getHmisApiUrl()).toBe('https://api.example.com');
    });

    it('returns null when API URL not set', () => {
      mockStorage.get.mockReturnValue(null);
      expect(getHmisApiUrl()).toBeNull();
    });
  });

  describe('storeHmisAuthToken', () => {
    it('stores auth token in SecureStore', async () => {
      await storeHmisAuthToken('token123');
      expect(mockSecureStore.setItemAsync).toHaveBeenCalledWith(
        'hmis_auth_token',
        'token123'
      );
    });
  });

  describe('getHmisAuthToken', () => {
    it('retrieves auth token from SecureStore', async () => {
      mockSecureStore.getItemAsync.mockResolvedValue('token123');
      const token = await getHmisAuthToken();
      expect(token).toBe('token123');
    });

    it('returns null when token not found', async () => {
      mockSecureStore.getItemAsync.mockResolvedValue(null);
      const token = await getHmisAuthToken();
      expect(token).toBeNull();
    });

    it('returns null and logs warning on error', async () => {
      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
      mockSecureStore.getItemAsync.mockRejectedValue(
        new Error('Storage error')
      );

      const token = await getHmisAuthToken();

      expect(token).toBeNull();
      expect(consoleWarnSpy).toHaveBeenCalled();
      consoleWarnSpy.mockRestore();
    });
  });

  describe('clearHmisAuthToken', () => {
    it('deletes auth token from SecureStore', async () => {
      await clearHmisAuthToken();
      expect(mockSecureStore.deleteItemAsync).toHaveBeenCalledWith(
        'hmis_auth_token'
      );
    });

    it('silently handles errors when token does not exist', async () => {
      mockSecureStore.deleteItemAsync.mockRejectedValue(
        new Error('Item not found')
      );
      await expect(clearHmisAuthToken()).resolves.not.toThrow();
    });
  });
});
