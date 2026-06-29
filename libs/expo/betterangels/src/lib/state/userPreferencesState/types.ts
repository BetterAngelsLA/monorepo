import { LocationDraft } from '../../screens/NotesHmis/NoteFormHmis';

export type TUserPreferencesState = {
  teamId: string | null;
  location: LocationDraft | null;
};
