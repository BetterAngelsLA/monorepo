import {
  authStorage,
  CSRF_HEADER_NAME,
  CSRF_LOGIN_PATH,
  ENVIRONMENT_STORAGE_KEY,
} from '@monorepo/expo/shared/utils';
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { Platform } from 'react-native';
import { getCSRFToken } from '../common';
import { createNativeFetch } from '../common/nativeFetch';

type Env = 'production' | 'demo';

interface ApiConfigContextType {
  baseUrl: string;
  environment: Env;
  switchEnvironment: (env: Env) => Promise<void>;
  fetchClient: (path: string, options?: RequestInit) => Promise<Response>;
}

const ApiConfigContext = createContext<ApiConfigContextType | null>(null);

export const ApiConfigProvider = ({
  children,
  productionUrl,
  demoUrl,
}: {
  children: ReactNode;
  productionUrl: string;
  demoUrl: string;
}) => {
  const [environment, setEnvironment] = useState<Env | null>(null);
  const baseUrl = environment === 'demo' ? demoUrl : productionUrl;

  useEffect(() => {
    const loadEnvironment = async () => {
      const saved = await AsyncStorage.getItem(ENVIRONMENT_STORAGE_KEY);
      setEnvironment(saved === 'demo' ? 'demo' : 'production');
    };
    loadEnvironment();
  }, [demoUrl, productionUrl]);

  const switchEnvironment = async (env: Env) => {
    if (env === environment) {
      return;
    }
    await authStorage.clearAllCredentials();
    await AsyncStorage.setItem(ENVIRONMENT_STORAGE_KEY, env);
    setEnvironment(env);
  };

  const fetchClient = useMemo(() => {
    if (Platform.OS === 'web') {
      return async (path: string, options: RequestInit = {}) => {
        const token = await getCSRFToken(
          baseUrl,
          `${baseUrl}${CSRF_LOGIN_PATH}`
        );
        const headers = new Headers(options.headers);
        headers.set('Content-Type', 'application/json');
        if (token) {
          headers.set(CSRF_HEADER_NAME, token);
        }

        return fetch(`${baseUrl}${path}`, {
          ...options,
          credentials: 'include',
          headers,
        });
      };
    }

    const nativeFetch = createNativeFetch(baseUrl, baseUrl);
    return async (path: string, options: RequestInit = {}) => {
      const headers = new Headers(options.headers);
      headers.set('Content-Type', 'application/json');
      return nativeFetch(`${baseUrl}${path}`, { ...options, headers });
    };
  }, [baseUrl]);

  if (environment === null) {
    return null;
  }

  return (
    <ApiConfigContext.Provider
      value={{ baseUrl, environment, switchEnvironment, fetchClient }}
    >
      {children}
    </ApiConfigContext.Provider>
  );
};

export const useApiConfig = () => {
  const context = useContext(ApiConfigContext);
  if (!context) {
    throw new Error('useApiConfig must be used within an ApiConfigProvider');
  }
  return context;
};
