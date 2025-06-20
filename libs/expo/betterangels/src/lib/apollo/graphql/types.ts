import { NotesQuery } from './__generated__/queries.generated';

export type TNotesQueryInteraction = NonNullable<
  NonNullable<NotesQuery['notes']>['results']
>[number];
