import { SelahTeamEnum } from '../../apollo';
import { LocationDraft } from '../../screens/NotesHmis/HmisProgramNoteForm';

export type TUserPreferencesState = {
  team: SelahTeamEnum | null;
  location: LocationDraft | null;
};
