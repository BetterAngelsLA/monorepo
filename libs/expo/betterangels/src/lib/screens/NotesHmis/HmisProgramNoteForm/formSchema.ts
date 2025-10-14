import { z } from 'zod';

export type THmisProgramNoteFormSchema = z.infer<
  typeof HmisProgramNoteFormSchema
>;

export const hmisProgramNoteFormEmptyState: THmisProgramNoteFormSchema = {
  personalId: '',
  title: '',
  date: '',
  program: '',
  note: '',
};

export const HmisProgramNoteFormSchema = z.object({
  personalId: z.string().min(1, 'PersonalId is required.'),
  title: z.string().min(1, 'Purpose is required.'),
  //   date: z.string().min(1, 'Date is required.'),
  //   program: z.string().min(1, 'Program is required.'),
  //   note: z.string().min(1, 'Note is required.'),
  date: z.string(),
  program: z.string(),
  note: z.string(),
});
