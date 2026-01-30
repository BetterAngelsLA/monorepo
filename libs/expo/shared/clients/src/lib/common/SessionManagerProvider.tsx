import { useEffect, useRef } from 'react';
import { useApiConfig } from '../http';
import { SessionManager, setSessionManager } from './sessionManager';

/**
 * Creates SessionManager instances tied to the current backend URL.
 * When URL changes, destroys old instance and creates new one.
 */
export function SessionManagerProvider() {
  const { baseUrl } = useApiConfig();
  const managerRef = useRef<SessionManager | null>(null);

  useEffect(() => {
    // Destroy old instance
    managerRef.current?.destroy();

    // Create new instance
    const manager = new SessionManager(baseUrl);
    managerRef.current = manager;
    setSessionManager(manager);

    return () => {
      managerRef.current?.destroy();
      setSessionManager(null);
    };
  }, [baseUrl]);

  return null;
}
