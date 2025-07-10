import { atom, useAtomValue, useSetAtom } from 'jotai';
import { Region } from 'react-native-maps';
import { clientInteractionsMapState } from '../clientInteractionsMapState';

// atom with setter only
const regionSetterAtom = atom(null, (_get, set, region: Region | null) =>
  set(clientInteractionsMapState, (prev) => ({ ...prev, region }))
);

const regionValueAtom = atom((get) => get(clientInteractionsMapState).region);

// getter hook
export const useClientInteractionsMapStateRegion = () =>
  useAtomValue(regionValueAtom);

// setter hook
export const useSetClientInteractionsMapStateRegion = () =>
  useSetAtom(regionSetterAtom);
