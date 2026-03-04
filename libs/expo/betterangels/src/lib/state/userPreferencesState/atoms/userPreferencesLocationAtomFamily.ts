import { atom } from 'jotai';
import { atomFamily } from 'jotai-family';
import { LocationDraft } from '../../../screens/NotesHmis/HmisProgramNoteForm';
import { userPreferencesAtomFamily } from './userPreferencesAtomFamily';

export const userPreferencesLocationAtomFamily = atomFamily(
  (userId: string) => {
    const preferencesAtom = userPreferencesAtomFamily(userId);

    return atom(
      (get) => {
        return get(preferencesAtom).location;
      },
      (_get, set, nextLocation: LocationDraft | null) => {
        set(preferencesAtom, (prev) => ({
          ...prev,
          location: nextLocation,
        }));
      }
    );
  }
);
