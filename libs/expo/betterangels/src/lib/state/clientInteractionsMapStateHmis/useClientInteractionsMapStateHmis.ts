import { useAtom } from 'jotai';
import { clientInteractionsMapStateHmis } from './clientInteractionsMapStateHmis';

export const useClientInteractionsMapStateHmis = () =>
  useAtom(clientInteractionsMapStateHmis);
