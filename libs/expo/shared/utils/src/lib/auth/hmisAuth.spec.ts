import * as SecureStore from 'expo-secure-store';

import {
  clearHmisAuthToken,
  getHmisApiUrl,
  getHmisAuthToken,
  storeHmisApiUrl,
  storeHmisAuthToken,
} from './hmisAuth';

const mockStorage = {
  get: jest.fn(),
  set: jest.fn(),
};

jest.mock('expo-secure-store');
jest.mock('../storage/createPersistentSynchronousStorage', () => ({
  createPersistentSynchronousStorage: jest.fn(() => mockStorage),
}));

describe('hmisAuth', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (SecureStore.deleteItemAsync as jest.Mock).mockResolvedValue(undefined);
    (SecureStore.setItemAsync as jest.Mock).mockResolvedValue(undefined);
    (SecureStore.getItemAsync as jest.Mock).mockResolvedValue(null);
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
      expect(SecureStore.setItemAsync).toHaveBeenCalledWith(
        'hmis_auth_token',
        'token123'
      );
    });
  });

  describe('getHmisAuthToken', () => {
    it('retrieves auth token from SecureStore', async () => {
      (SecureStore.getItemAsync as jest.Mock).mockResolvedValue('token123');
      const token = await getHmisAuthToken();
      expect(token).toBe('token123');
    });

    it('returns null when token not found', async () => {
      (SecureStore.getItemAsync as jest.Mock).mockResolvedValue(null);
      const token = await getHmisAuthToken();
      expect(token).toBeNull();
    });
  });

  describe('clearHmisAuthToken', () => {
    it('deletes auth token from SecureStore', async () => {
      await clearHmisAuthToken();
      expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith(
        'hmis_auth_token'
      );
      await expect(clearHmisAuthToken()).resolves.not.toThrow();
    });
  });
});
