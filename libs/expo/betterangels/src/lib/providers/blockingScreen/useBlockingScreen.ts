import { useNavigation } from 'expo-router';
import { useCallback, useContext } from 'react';
import { BlockingScreenContext } from './BlockingScreenContext';

let pendingUnsub: (() => void) | null = null;

export function useBlockingScreen() {
  const context = useContext(BlockingScreenContext);
  const navigation = useNavigation();

  if (!context) {
    throw new Error('BlockingScreenContext missing');
  }

  const { blockScreen, unblockScreen } = context;

  const blockScreenUntilNextNavigation = useCallback(() => {
    if (pendingUnsub) {
      return;
    }

    blockScreen();

    pendingUnsub = navigation.addListener('blur', () => {
      unblockScreen();

      // cleanup
      pendingUnsub?.();
      pendingUnsub = null;
    });
  }, [blockScreen, unblockScreen, navigation]);

  return { blockScreen, unblockScreen, blockScreenUntilNextNavigation };
}
