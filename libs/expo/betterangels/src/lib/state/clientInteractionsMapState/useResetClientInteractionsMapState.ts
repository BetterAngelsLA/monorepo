import { useSetAtom } from 'jotai';
import {
  TClientInteractionsMapState,
  clientInteractionsMapState,
  nullState,
} from './clientInteractionsMapState';

export const useResetClientInteractionsMapState = () => {
  const setState = useSetAtom(clientInteractionsMapState);

  return (newId?: string | null) => {
    setState((prev): TClientInteractionsMapState => {
      // undefined, so do nothing
      if (newId === undefined) {
        return prev;
      }

      // hard reset
      if (newId === null) {
        return nullState;
      }

      const clientIdChanged = prev.clientProfileId !== newId;

      if (!clientIdChanged) {
        return prev;
      }

      return { ...nullState, clientProfileId: newId };
    });
  };
};
