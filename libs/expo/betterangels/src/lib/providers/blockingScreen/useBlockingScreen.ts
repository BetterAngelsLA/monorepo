import { useContext } from 'react';
import { BlockingScreenContext } from './BlockingScreenContext';

export function useBlockingScreen() {
  const context = useContext(BlockingScreenContext);

  if (!context) {
    throw new Error('BlockingScreenContext missing');
  }

  return context;
}
