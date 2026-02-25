import { useSetAtom } from 'jotai';
import {
  THmisClientInteractionsMapState,
  hmisClientInteractionsMapState,
  hmisNullState,
} from './hmisClientInteractionsMapState';

export const useResetHmisClientInteractionsMapState = () => {
  const setState = useSetAtom(hmisClientInteractionsMapState);

  return (newId?: string | null) => {
    setState((prev): THmisClientInteractionsMapState => {
      // undefined, so do nothing
      if (newId === undefined) {
        return prev;
      }

      // hard reset
      if (newId === null) {
        return hmisNullState;
      }

      const clientIdChanged = prev.clientProfileId !== newId;

      if (!clientIdChanged) {
        return prev;
      }

      return { ...hmisNullState, clientProfileId: newId };
    });
  };
};
