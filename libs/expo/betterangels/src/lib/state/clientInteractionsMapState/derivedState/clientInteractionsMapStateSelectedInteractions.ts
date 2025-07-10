import { atom, useAtomValue, useSetAtom } from 'jotai';
import { TNotesQueryInteraction } from '../../../apollo';
import { clientInteractionsMapState } from '../clientInteractionsMapState';

// atom with setter only
const stateSelectedInteractionsSetterAtom = atom(
  null,
  (_get, set, selectedInteractions: TNotesQueryInteraction[]) =>
    set(clientInteractionsMapState, (prev) => ({
      ...prev,
      selectedInteractions,
    }))
);

const stateSelectedInteractionsValueAtom = atom(
  (get) => get(clientInteractionsMapState).selectedInteractions
);

// getter hook
export const useClientInteractionsMapStateSelectedInteractions = () =>
  useAtomValue(stateSelectedInteractionsValueAtom);

// setter hook
export const useSetClientInteractionsMapStateSelectedInteractions = () =>
  useSetAtom(stateSelectedInteractionsSetterAtom);
