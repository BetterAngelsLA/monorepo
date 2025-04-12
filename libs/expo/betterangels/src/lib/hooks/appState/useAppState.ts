import { useEffect, useRef, useState } from 'react';
import {
  AppState,
  AppStateStatus,
  NativeEventSubscription,
} from 'react-native';

let appStateSubscription: NativeEventSubscription | null = null;

export default function useAppState() {
  // storing as Refs as would not want to trigger renders on change
  const appState = useRef(AppState.currentState);
  // const movedToForeground = useRef(false);
  const [becameActive, setBecameActive] = useState(false);
  // const movedToForeground = useRef(false);

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

  const handleAppStateChange = (nextAppState: AppStateStatus) => {
    const newMovedToforegroundState =
      appState.current !== 'active' && nextAppState === 'active';

    // movedToForeground.current = newMovedToforegroundState;
    setBecameActive(newMovedToforegroundState);

    appState.current = nextAppState;
  };

  return {
    currentState: appState.current,
    // movedToForeground: movedToForeground.current,
    movedToForeground: becameActive,
  };
}
