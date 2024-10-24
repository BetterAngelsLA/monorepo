import { setItem } from '@monorepo/expo/shared/utils';
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { CSRF_COOKIE_NAME } from '../apollo/links/constants';

interface ApiConfigContextType {
  baseUrl: string;
  environment: 'production' | 'demo';
  switchEnvironment: (env: 'production' | 'demo') => Promise<void>;
}

const ApiConfigContext = createContext<ApiConfigContextType | undefined>(
  undefined
);

interface ApiConfigProviderProps {
  children: React.ReactNode;
  productionUrl: string;
  demoUrl: string;
}

export const ApiConfigProvider = ({
  children,
  productionUrl,
  demoUrl,
}: ApiConfigProviderProps) => {
  const [environment, setEnvironment] = useState<'production' | 'demo' | null>(
    null
  );

  const apiUrls = {
    production: productionUrl,
    demo: demoUrl,
  };

  useEffect(() => {
    const loadEnvironment = async () => {
      try {
        const storedEnv = await AsyncStorage.getItem('currentEnvironment');
        const env = storedEnv === 'demo' ? 'demo' : 'production';
        setEnvironment(env);
      } catch (error) {
        console.error('Error loading environment from AsyncStorage', error);
        setEnvironment('production');
      }
    };
    loadEnvironment();
  }, []);

  const baseUrl = environment ? apiUrls[environment] : '';

  const switchEnvironment = async (env: 'production' | 'demo') => {
    if (environment !== env) {
      try {
        await AsyncStorage.setItem('currentEnvironment', env);
        setEnvironment(env);
        await setItem(CSRF_COOKIE_NAME, '');
      } catch (error) {
        console.error('Error switching environment', error);
      }
    }
  };

  if (!environment) {
    return null;
  }

  return (
    <ApiConfigContext.Provider
      value={{ baseUrl, environment, switchEnvironment }}
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
