import { useContext } from 'react';
import { InteractionsMapStateContext } from '../InteractionsMapStateProvider';

export function useInteractionsMapState() {
  const context = useContext(InteractionsMapStateContext);

  if (!context) {
    throw new Error(
      'useInteractionsMapState must be used within a InteractionsMapStateProvider'
    );
  }

  return context;
}
