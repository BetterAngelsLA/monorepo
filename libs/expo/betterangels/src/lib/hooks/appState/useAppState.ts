import { useCallback, useEffect, useRef, useState } from 'react';
import {
  AppState,
  AppStateStatus,
  NativeEventSubscription,
} from 'react-native';

export default function useAppState() {
  const appStateSubscription = useRef<NativeEventSubscription | null>(null);

  const [becameActive, setBecameActive] = useState(false);
  const [currentState, setCurrentState] = useState<AppStateStatus>(
    AppState.currentState
  );

  const handleAppStateChange = useCallback((newState: AppStateStatus) => {
    setCurrentState((prevState) => {
      const becameActive = prevState !== 'active' && newState === 'active';

      setBecameActive(becameActive);

      return newState;
    });
  }, []);

  useEffect(() => {
    if (!appStateSubscription.current) {
      appStateSubscription.current = AppState.addEventListener(
        'change',
        handleAppStateChange
      );
    }

    return () => {
      appStateSubscription.current?.remove();
      appStateSubscription.current = null;
    };
  }, [handleAppStateChange]);

  return {
    currentAppState: currentState,
    appBecameActive: becameActive,
  };
}
