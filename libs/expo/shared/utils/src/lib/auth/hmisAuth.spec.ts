import * as SecureStore from 'expo-secure-store';
import { authStorage } from './authStorage';

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
      authStorage.storeHmisApiUrl('https://api.example.com');
      expect(mockStorage.set).toHaveBeenCalledWith(
        'hmis_api_url',
        'https://api.example.com'
      );
    });
  });

  describe('getHmisApiUrl', () => {
    it('retrieves API URL from MMKV storage', () => {
      mockStorage.get.mockReturnValue('https://api.example.com');
      expect(authStorage.getHmisApiUrl()).toBe('https://api.example.com');
    });

    it('returns null when API URL not set', () => {
      mockStorage.get.mockReturnValue(null);
      expect(authStorage.getHmisApiUrl()).toBeNull();
    });
  });

  describe('storeHmisAuthToken', () => {
    it('stores auth token in SecureStore', () => {
      authStorage.storeHmisAuthToken('token123');
      expect(mockStorage.set).toHaveBeenCalledWith(
        'hmis_auth_token',
        'token123'
      );
    });
  });

  describe('getHmisAuthToken', () => {
    it('retrieves auth token from SecureStore', () => {
      mockStorage.get.mockReturnValue('token123');
      const token = authStorage.getHmisAuthToken();
      expect(token).toBe('token123');
    });

    it('returns null when token not found', () => {
      mockStorage.get.mockReturnValue(null);
      const token = authStorage.getHmisAuthToken();
      expect(token).toBeNull();
    });
  });

  describe('clearHmisAuthToken', () => {
    it('deletes auth token from SecureStore', async () => {
      await authStorage.clearAllCredentials();
      expect(SecureStore.deleteItemAsync).toHaveBeenCalled();
    });
  });
});
