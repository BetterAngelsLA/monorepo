import { format } from 'date-fns';
import { z } from 'zod';

export const HmisProgramNoteFormSchema = z.object({
  title: z.string().min(1, 'Purpose is required.'),
  date: z
    .date()
    .optional()
    .refine(
      (val) => val instanceof Date && !Number.isNaN(val.getTime()), // not using isValid as it allows integer dates
      'Date is required.'
    ),
  enrollmentId: z.string().min(1, 'Program is required.'),
  note: z.string().min(1, 'Note is required.'),
});

export type THmisProgramNoteFormSchema = z.infer<
  typeof HmisProgramNoteFormSchema
>;

/**
 * Static empty state used for resets (e.g., clearing a single field).
 * NOTE: date is intentionally undefined here. Do NOT put `new Date()` here,
 * because this object is evaluated once at module load.
 */
export const hmisProgramNoteFormEmptyState: THmisProgramNoteFormSchema = {
  title: '',
  date: undefined,
  enrollmentId: '',
  note: '',
};

/**
 * Dynamic empty state to use when initializing a NEW form instance.
 * This ensures `new Date()` is called each time the form is created.
 */
export const getHmisProgramNoteFormEmptyState =
  (): THmisProgramNoteFormSchema => ({
    ...hmisProgramNoteFormEmptyState,
    date: new Date(),
  });

export const HmisProgramNoteFormSchemaOutput = HmisProgramNoteFormSchema.extend(
  {
    date: z.date(), // required
  }
).transform(({ date, ...rest }) => ({
  ...rest,
  date: format(date, 'yyyy-MM-dd'),
}));

export type THmisProgramNoteFormInputs = z.input<
  typeof HmisProgramNoteFormSchema
>;
export type THmisProgramNoteFormOutputs = z.output<
  typeof HmisProgramNoteFormSchemaOutput
>;
