import { format } from 'date-fns';
import { z } from 'zod';
import { ServiceRequestTypeEnum } from '../../../apollo';

const StandardServiceDraftSchema = z.object({
  serviceRequestId: z.string().optional(),
  serviceId: z.string().optional(),
  label: z.string().optional(),
  markedForDeletion: z.boolean().optional(),
});

const OtherServiceDraftSchema = z.object({
  serviceRequestId: z.string().optional(),
  serviceOther: z.string().optional().nullable(),
  markedForDeletion: z.boolean().optional(),
});

const ServiceBucketSchema = z.object({
  serviceRequests: z
    .array(StandardServiceDraftSchema)
    .default([])
    .transform((arr) =>
      arr.filter(
        (i) => i.markedForDeletion === true || i.serviceRequestId || i.serviceId
      )
    ),
  serviceRequestsOthers: z
    .array(OtherServiceDraftSchema)
    .default([])
    .transform((arr) =>
      arr.filter(
        (i) =>
          i.markedForDeletion === true ||
          i.serviceRequestId ||
          (typeof i.serviceOther === 'string' &&
            i.serviceOther.trim().length > 0)
      )
    ),
});

const ServicesDraftSchema = z
  .object({
    [ServiceRequestTypeEnum.Provided]: ServiceBucketSchema.optional(),
    [ServiceRequestTypeEnum.Requested]: ServiceBucketSchema.optional(),
  })
  .default({});

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
  services: ServicesDraftSchema.optional().default({}),
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
