import { SelahTeamEnum } from '../../apollo';
import { LocationDraft } from '../../screens/NotesHmis/NoteFormHmis';

export type TUserPreferencesState = {
  team: SelahTeamEnum | null;
  location: LocationDraft | null;
  organizationId: string | null;
};
