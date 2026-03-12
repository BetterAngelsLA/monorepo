import { HmisClientProfileType } from '../../../../apollo';
import { TImportantNotesFormSchema } from './formSchema';

export function mapClientToImportantNotes(
  client: HmisClientProfileType
): TImportantNotesFormSchema {
  const { importantNotes } = client;

  return {
    importantNotes: importantNotes || '',
  };
}
