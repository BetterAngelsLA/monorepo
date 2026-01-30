import { useEffect } from 'react';
import { useApiConfig } from '../http/ApiConfigProvider';
import { SessionManager } from './sessionManager';

/**
 * Creates SessionManager instances tied to the current backend URL.
 * When URL changes, destroys old instance and creates new one.
 */
export function SessionManagerProvider() {
  const { baseUrl } = useApiConfig();

  useEffect(() => {
    SessionManager.initialize(baseUrl);
    return () => SessionManager.clearInstance();
  }, [baseUrl]);

  return null;
}
