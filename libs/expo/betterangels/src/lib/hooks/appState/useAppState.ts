import { useEffect, useState } from 'react';
import {
  AppState,
  AppStateStatus,
  NativeEventSubscription,
} from 'react-native';

let appStateSubscription: NativeEventSubscription | null = null;

export default function useAppState() {
  const [currentState, setCurrentState] = useState<AppStateStatus>(
    AppState.currentState
  );
  const [becameActive, setBecameActive] = useState(false);

  useEffect(() => {
    if (!appStateSubscription) {
      appStateSubscription = AppState.addEventListener(
        'change',
        handleAppStateChange
      );
    }

    return () => {
      appStateSubscription?.remove();
      appStateSubscription = null;
    };
  }, []);

  const handleAppStateChange = (newState: AppStateStatus) => {
    setCurrentState((prevState) => {
      const becameActive = prevState !== 'active' && newState === 'active';

      setBecameActive(becameActive);

      return newState;
    });
  };

  return {
    currentAppState: currentState,
    appBecameActive: becameActive,
  };
}
