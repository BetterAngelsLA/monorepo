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
export type DraftTask = z.infer<typeof TaskFormSchema>;

const TaskFormSchema = z.object({
  id: z.string().optional(),
  summary: z.string().min(1, 'Title is required.').nullable(),
  team: z.enum(SelahTeamEnum).nullable(),
  description: z.string().nullable(),
  status: z
    .enum(TaskStatusEnum, {
      error: () => 'Status is required',
    })
    .nullable(),
  markedForDeletion: z.boolean().optional(),
});

// ----------------------------------------------------------------------
// 2. Validation Schema
// ----------------------------------------------------------------------

export type LocationDraft =
  | Partial<{
      latitude: number;
      longitude: number;
      formattedAddress: string;
      shortAddressName: string;
      components?: string;
    }>
  | undefined;

export const LocationSchema = z
  .object({
    latitude: z.number().gte(-90).lte(90),
    longitude: z.number().gte(-180).lte(180),
    formattedAddress: z.string().min(1, 'Required'),
    shortAddressName: z.string().optional(),
    components: z.any().optional(), // accept array/object from Google
  })
  .strict();

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
  location: LocationSchema,

  // FIX 1: Remove .default([]). This makes the field REQUIRED in the type definition,
  // preventing the "undefined is not assignable to LocalDraftTask[]" error.
  // We handle the default value via the 'getHmisProgramNoteFormEmptyState' function.
  tasks: z.array(TaskFormSchema).optional(),
  services: z.custom<ServicesDraft>().optional(),
});

// ----------------------------------------------------------------------
// 3. Types
// ----------------------------------------------------------------------

// We explicitly intersect to ensure the TypeScript type for draftTasks is robust
export type THmisProgramNoteFormInputs = z.input<
  typeof HmisProgramNoteFormSchema
>;

// ----------------------------------------------------------------------
// 4. Output Schema (API Payload)
// ----------------------------------------------------------------------

export const HmisProgramNoteFormSchemaOutput = HmisProgramNoteFormSchema.extend(
  {
    date: z.date(), // required
  }
).transform(({ date, ...rest }) => ({
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
  location: undefined as any,
  tasks: [],
  services: {},
};

export const getHmisProgramNoteFormEmptyState =
  (): THmisProgramNoteFormInputs => ({
    ...hmisProgramNoteFormEmptyState,
    date: new Date(),
  });

// ----------------------------------------------------------------------
// 6. Field Names
// ----------------------------------------------------------------------

type HmisNoteFormFieldName = keyof typeof HmisProgramNoteFormSchema.shape;

export const HmisNoteFormFieldNames = Object.keys(
  HmisProgramNoteFormSchema.shape
) as HmisNoteFormFieldName[];
