import { useSetAtom } from 'jotai';
import {
  TClientInteractionsMapStateHmis,
  clientInteractionsMapStateHmis,
  nullStateHmis,
} from './clientInteractionsMapStateHmis';

export const useResetClientInteractionsMapStateHmis = () => {
  const setState = useSetAtom(clientInteractionsMapStateHmis);

  return (newId?: string | null) => {
    setState((prev): TClientInteractionsMapStateHmis => {
      // undefined, so do nothing
      if (newId === undefined) {
        return prev;
      }

      // hard reset
      if (newId === null) {
        return nullStateHmis;
      }

      const clientIdChanged = prev.clientProfileId !== newId;

      if (!clientIdChanged) {
        return prev;
      }

      return { ...nullStateHmis, clientProfileId: newId };
    });
  };
};
