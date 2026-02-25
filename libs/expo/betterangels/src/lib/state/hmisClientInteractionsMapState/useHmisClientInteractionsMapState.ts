import { useAtom } from 'jotai';
import { hmisClientInteractionsMapState } from './hmisClientInteractionsMapState';

export const useHmisClientInteractionsMapState = () =>
  useAtom(hmisClientInteractionsMapState);
