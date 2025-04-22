import { useCallback, useEffect, useRef, useState } from 'react';
import {
  AppState,
  AppStateStatus,
  NativeEventSubscription,
} from 'react-native';

type TAppState = {
  currentAppState: AppStateStatus;
  appBecameActive: boolean;
};

export default function useAppState() {
  const appStateSubscription = useRef<NativeEventSubscription | null>(null);

  const [appState, setAppState] = useState<TAppState>({
    currentAppState: AppState.currentState,
    appBecameActive: false,
  });

  const handleAppStateChange = useCallback((newState: AppStateStatus) => {
    setAppState((prevState) => {
      const { currentAppState: prevCurrent } = prevState;
      const becameActive = prevCurrent !== 'active' && newState === 'active';

      return {
        currentAppState: newState,
        appBecameActive: becameActive,
      };
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

  return appState;
}
