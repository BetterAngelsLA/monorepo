import { format } from 'date-fns';
import { z } from 'zod';
import {
  SelahTeamEnum,
  ServiceRequestTypeEnum,
  TaskStatusEnum,
} from '../../../apollo';

// ----------------------------------------------------------------------
// 1. Local Draft Task Type
// ----------------------------------------------------------------------
export type LocalDraftTask = {
  id: string;
  summary: string;
  description?: string | null;
  status?: TaskStatusEnum;
  team?: SelahTeamEnum | null;
};

// ----------------------------------------------------------------------
// 2. Validation Schema
// ----------------------------------------------------------------------

export type ServicesDraft = Partial<
  Record<
    ServiceRequestTypeEnum,
    {
      serviceRequests: {
        id: string;
        service?: { id: string; label: string } | null;
        markedForDeletion?: boolean;
        serviceOther?: string | null;
      }[];
    }
  >
>;

export const HmisProgramNoteFormSchema = z.object({
  title: z.string().min(1, 'Purpose is required.'),
  date: z
    .date()
    .optional()
    .refine(
      (val) => val instanceof Date && !Number.isNaN(val.getTime()),
      'Date is required.'
    ),
  refClientProgram: z.string(),
  note: z.string().min(1, 'Note is required.'),

  // FIX 1: Remove .default([]). This makes the field REQUIRED in the type definition,
  // preventing the "undefined is not assignable to LocalDraftTask[]" error.
  // We handle the default value via the 'getHmisProgramNoteFormEmptyState' function.
  draftTasks: z.array(z.custom<LocalDraftTask>()),
  services: z.custom<ServicesDraft>().optional(),
});

// ----------------------------------------------------------------------
// 3. Types
// ----------------------------------------------------------------------

// We explicitly intersect to ensure the TypeScript type for draftTasks is robust
export type THmisProgramNoteFormInputs = z.input<
  typeof HmisProgramNoteFormSchema
> & {
  draftTasks: LocalDraftTask[];
};

// ----------------------------------------------------------------------
// 4. Output Schema (API Payload)
// ----------------------------------------------------------------------

// We omit draftTasks so it doesn't interfere with the Note creation payload parsing
export const HmisProgramNoteFormSchemaOutput = HmisProgramNoteFormSchema.omit({
  draftTasks: true,
})
  .extend({
    date: z.date(), // required
  })
  .transform(({ date, ...rest }) => ({
    ...rest,
    date: format(date, 'yyyy-MM-dd'),
  }));

export type THmisProgramNoteFormOutputs = z.output<
  typeof HmisProgramNoteFormSchemaOutput
>;

// ----------------------------------------------------------------------
// 5. Empty States
// ----------------------------------------------------------------------

export const hmisProgramNoteFormEmptyState: THmisProgramNoteFormInputs = {
  title: '',
  date: undefined,
  refClientProgram: '',
  note: '',
  draftTasks: [],
  services: {},
};

export const getHmisProgramNoteFormEmptyState =
  (): THmisProgramNoteFormInputs => ({
    ...hmisProgramNoteFormEmptyState,
    date: new Date(),
    draftTasks: [],
  });

// ----------------------------------------------------------------------
// 6. Field Names
// ----------------------------------------------------------------------

type HmisNoteFormFieldName = keyof typeof HmisProgramNoteFormSchema.shape;

export const HmisNoteFormFieldNames = Object.keys(
  HmisProgramNoteFormSchema.shape
) as HmisNoteFormFieldName[];
