import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useState } from 'react';

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
  const [environment, setEnvironment] = useState<'production' | 'demo'>(
    'production'
  );

  const apiUrls = {
    production: productionUrl,
    demo: demoUrl,
  };

  useEffect(() => {
    (async () => {
      try {
        const storedEnv = await AsyncStorage.getItem('currentEnvironment');
        if (storedEnv === 'demo') setEnvironment('demo');
      } catch (error) {
        console.error('Error loading environment from AsyncStorage:', error);
      }
    })();
  }, []);

  const switchEnvironment = async (env: 'production' | 'demo') => {
    if (environment === env) return;

    try {
      await Promise.all([AsyncStorage.setItem('currentEnvironment', env)]);
      setEnvironment(env);
    } catch (error) {
      console.error('Error switching environment:', error);
    }
  };

  return (
    <ApiConfigContext.Provider
      value={{ baseUrl: apiUrls[environment], environment, switchEnvironment }}
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
