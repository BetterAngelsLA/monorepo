import * as SecureStore from 'expo-secure-store';
import { createPersistentSynchronousStorage } from '../storage/createPersistentSynchronousStorage';
import { HMIS_API_URL_KEY, HMIS_AUTH_TOKEN_KEY } from './constants';

// Lazy initialization for test mocking
let storage: ReturnType<typeof createPersistentSynchronousStorage> | null =
  null;
const getStorage = () =>
  storage ??
  (storage = createPersistentSynchronousStorage({ scopeId: 'hmis-auth' }));

export const storeHmisAuthToken = async (token: string): Promise<void> => {
  await SecureStore.setItemAsync(HMIS_AUTH_TOKEN_KEY, token);
};

export const getHmisAuthToken = async (): Promise<string | null> => {
  return await SecureStore.getItemAsync(HMIS_AUTH_TOKEN_KEY);
};

export const clearHmisAuthToken = async (): Promise<void> => {
  await SecureStore.deleteItemAsync(HMIS_AUTH_TOKEN_KEY);
};

export const storeHmisApiUrl = (apiUrl: string): void => {
  getStorage().set(HMIS_API_URL_KEY, apiUrl);
};

export const getHmisApiUrl = (): string | null => {
  return getStorage().get<string>(HMIS_API_URL_KEY) ?? null;
};

export const clearAllHmisCredentials = async (): Promise<void> => {
  await clearHmisAuthToken();
  getStorage().remove(HMIS_API_URL_KEY);
};
