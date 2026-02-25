import { z } from 'zod';

export type TImportantNotesFormSchema = z.input<
  typeof ImportantNotesFormSchema
>;

export const importantNotesFormEmptyState: TImportantNotesFormSchema = {
  importantNotes: '',
};

export const ImportantNotesFormSchema = z.object({
  importantNotes: z.string().optional(),
});

export const ImportantNotesFormSchemaOut = ImportantNotesFormSchema.transform(
  ({ importantNotes }) => {
    return {
      importantNotes,
    };
  }
);
