import { format } from 'date-fns';
import { z } from 'zod';

export type THmisProgramNoteFormSchema = z.infer<
  typeof HmisProgramNoteFormSchema
>;

export const hmisProgramNoteFormEmptyState: THmisProgramNoteFormSchema = {
  title: '',
  date: undefined,
  program: '',
  note: '',
};

export const HmisProgramNoteFormSchema = z.object({
  title: z.string().min(1, 'Purpose is required.'),
  date: z
    .date()
    .optional()
    .refine(
      (val) => val instanceof Date && !Number.isNaN(val.getTime()), // not using isValid as it allows integer dates
      'Date is required.'
    ),
  program: z.string().min(1, 'Program is required.'),
  note: z.string().min(1, 'Note is required.'),
});

export const HmisProgramNoteFormtSchemaOutput =
  HmisProgramNoteFormSchema.extend({
    date: z.date(), // required
  }).transform(({ date, ...rest }) => ({
    ...rest,
    date: format(date, 'yyyy-MM-dd'),
  }));

export type TFormInput = z.input<typeof HmisProgramNoteFormSchema>;
export type TFormOutput = z.output<typeof HmisProgramNoteFormtSchemaOutput>;
