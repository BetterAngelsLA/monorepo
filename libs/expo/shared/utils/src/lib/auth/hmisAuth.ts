import * as SecureStore from 'expo-secure-store';
import { createPersistentSynchronousStorage } from '../storage/createPersistentSynchronousStorage';
import { PersistentSynchronousStorageApi } from '../storage/types';
import {
  HMIS_DOMAIN_KEY,
  HMIS_API_URL_KEY,
  HMIS_AUTH_TOKEN_KEY,
} from './constants';

interface HmisAuthDependencies {
  storage: PersistentSynchronousStorageApi;
  secureStore: {
    getItemAsync: (key: string) => Promise<string | null>;
    setItemAsync: (key: string, value: string) => Promise<void>;
    deleteItemAsync: (key: string) => Promise<void>;
  };
}

const defaultDependencies: HmisAuthDependencies = {
  storage: createPersistentSynchronousStorage({ scopeId: 'hmis-auth' }),
  secureStore: SecureStore,
};

let dependencies = defaultDependencies;

/** @internal - For testing only */
export const __setDependencies = (
  deps: Partial<HmisAuthDependencies>
): void => {
  dependencies = { ...defaultDependencies, ...deps };
};

/** @internal - For testing only */
export const __resetDependencies = (): void => {
  dependencies = defaultDependencies;
};

export const storeHmisAuthToken = async (token: string): Promise<void> => {
  await dependencies.secureStore.setItemAsync(HMIS_AUTH_TOKEN_KEY, token);
};

export const clearHmisAuthToken = async (): Promise<void> => {
  try {
    await dependencies.secureStore.deleteItemAsync(HMIS_AUTH_TOKEN_KEY);
  } catch {
    // Item may not exist
  }
};

export const storeHmisDomain = (domain: string): void => {
  dependencies.storage.set(HMIS_DOMAIN_KEY, domain);
};

export const getHmisDomain = (): string | null => {
  return dependencies.storage.get<string>(HMIS_DOMAIN_KEY) ?? null;
};

export const storeHmisApiUrl = (apiUrl: string): void => {
  dependencies.storage.set(HMIS_API_URL_KEY, apiUrl);
};

export const getHmisApiUrl = (): string | null => {
  return dependencies.storage.get<string>(HMIS_API_URL_KEY) ?? null;
};

export const getHmisAuthToken = async (): Promise<string | null> => {
  try {
    return await dependencies.secureStore.getItemAsync(HMIS_AUTH_TOKEN_KEY);
  } catch (error) {
    console.warn('Failed to get HMIS auth token:', error);
    return null;
  }
};
