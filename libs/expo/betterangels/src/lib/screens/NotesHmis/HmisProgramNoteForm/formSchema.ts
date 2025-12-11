import { format } from 'date-fns';
import { z } from 'zod';
import { ServiceRequestTypeEnum } from '../../../apollo';

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

export const LocationSchema = z.object({
  latitude: z.number().gte(-90).lte(90),
  longitude: z.number().gte(-180).lte(180),
  formattedAddress: z.string().min(1, 'Required'),
  components: z.string().optional(),
});

export const HmisProgramNoteFormSchema = z.object({
  title: z.string().min(1, 'Purpose is required.'),
  date: z
    .date()
    .optional()
    .refine(
      (val) => val instanceof Date && !Number.isNaN(val.getTime()), // not using isValid as it allows integer dates
      'Date is required.'
    ),
  refClientProgram: z.string(),
  note: z.string().min(1, 'Note is required.'),
  location: LocationSchema.optional(),
  services: z.custom<ServicesDraft>().optional(),
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
  refClientProgram: '',
  note: '',
  location: {
    latitude: 0,
    longitude: 0,
    formattedAddress: '',
    components: '',
  },
  services: {},
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

type HmisNoteFormFieldName = keyof typeof HmisProgramNoteFormSchema.shape;

export const HmisNoteFormFieldNames = Object.keys(
  HmisProgramNoteFormSchema.shape
) as HmisNoteFormFieldName[];
