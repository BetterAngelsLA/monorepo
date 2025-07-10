import { useAtom } from 'jotai';
import { clientInteractionsMapState } from './clientInteractionsMapState';

export const useClientInteractionsMapState = () =>
  useAtom(clientInteractionsMapState);
