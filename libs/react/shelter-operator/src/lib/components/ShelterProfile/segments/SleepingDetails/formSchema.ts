import { RoomStyleChoices } from '@monorepo/react/shelter';
import { z } from 'zod';
import { toDropdownValues } from '../../../base-ui/dropdown';
import { ShelterProfileType } from '../../types';

const baseSchema = z.object({
  totalBeds: z
    .number()
    .int('Total beds must be a whole number')
    .min(0, 'Total beds must be zero or greater')
    .nullable()
    .optional(),
  nonRestrictedBeds: z
    .number('Unrestricted beds must be a number')
    .int('Unrestricted beds must be a whole number')
    .min(0, 'Unrestricted beds must be zero or greater'),
  restrictedBeds: z
    .number('Restricted beds must be a number')
    .int('Restricted beds must be a whole number')
    .min(0, 'Restricted beds must be zero or greater'),
  restrictionNotes: z.string().trim(),
  roomStyles: z.array(z.enum(RoomStyleChoices)),
  roomStylesOther: z.string().trim().nullable().optional(),
  addNotesSleepingDetails: z.string(), // RichTextEditor field
});

export const formSchema = baseSchema.superRefine((data, ctx) => {
  // `other` fields already trimmed via baseSchema
  if (
    data.roomStyles.includes(RoomStyleChoices.Other) &&
    !data.roomStylesOther
  ) {
    ctx.addIssue({
      code: 'custom',
      path: ['roomStylesOther'],
      message: "This field is required when 'Other' is selected.",
    });
  }

  // Mirrors ShelterAvailability.clean(): the counts can never exceed the
  // shelter's total beds. `totalBeds` is nullable, so an unknown capacity
  // imposes no rule. The sum is at fault, so both counters carry the message.
  const availableBeds = data.nonRestrictedBeds + data.restrictedBeds;

  if (data.totalBeds != null && availableBeds > data.totalBeds) {
    const message = `Unrestricted + restricted beds (${availableBeds}) cannot exceed the shelter's total beds (${data.totalBeds}).`;

    for (const path of AVAILABILITY_COUNT_FIELDS) {
      ctx.addIssue({ code: 'custom', path: [path], message });
    }
  }
});

export type SleepingDetailsFormData = z.infer<typeof formSchema>;

export const formFieldNames = Object.keys(baseSchema.shape);

export const defaultFormValues: SleepingDetailsFormData = {
  totalBeds: undefined,
  nonRestrictedBeds: 0,
  restrictedBeds: 0,
  restrictionNotes: '',
  roomStyles: [],
  roomStylesOther: undefined,
  addNotesSleepingDetails: '',
};

export function toFormData(
  shelter: ShelterProfileType,
): SleepingDetailsFormData {
  const availability = shelter.availability;

  return {
    totalBeds: shelter.totalBeds,
    nonRestrictedBeds: availability?.nonRestrictedBeds ?? 0,
    restrictedBeds: availability?.restrictedBeds ?? 0,
    restrictionNotes: availability?.restrictionNotes ?? '',
    roomStyles: toDropdownValues(shelter.roomStyles),
    roomStylesOther: shelter.roomStylesOther,
    addNotesSleepingDetails: shelter.addNotesSleepingDetails ?? '',
  };
}

export const AVAILABILITY_INPUT = 'availability';
export const AVAILABILITY_COUNT_FIELDS = [
  'nonRestrictedBeds',
  'restrictedBeds',
] as const;
const AVAILABILITY_FIELD_NAMES = [
  ...AVAILABILITY_COUNT_FIELDS,
  'restrictionNotes',
] as const;
const AVAILABILITY_FIELD_PREFIX = `${AVAILABILITY_INPUT}.`;

export type AvailabilityPayload = Partial<
  Pick<SleepingDetailsFormData, (typeof AVAILABILITY_FIELD_NAMES)[number]>
>;

/**
 * The availability fields the operator actually changed, or `null` if none.
 *
 * The API treats `availability` as a partial update, so sending only the edited
 * fields is what keeps a save from this tab from overwriting fresher counts
 * entered elsewhere: an untouched counter is omitted rather than resent, and a
 * save that does not touch availability carries no availability payload at all
 * (so it adds no audit event either).
 */
export function toAvailabilityPayload(
  data: SleepingDetailsFormData,
  stored: SleepingDetailsFormData,
): AvailabilityPayload | null {
  const payload: AvailabilityPayload = {};

  for (const name of AVAILABILITY_FIELD_NAMES) {
    if (data[name] !== stored[name]) {
      payload[name] = data[name];
    }
  }

  return Object.keys(payload).length ? payload : null;
}

/**
 * Re-points availability validation messages at the form fields they belong to.
 *
 * The availability counters are a nested input, so the API reports them under
 * `availability.<field>`; the form renders them as top-level fields. A
 * parent-level `availability` message belongs to both counters, mirroring where
 * the backend attributes the cap.
 */
export function toFormFieldErrors(
  errors: { field: string; message: string }[],
): { field: string; message: string }[] {
  return errors.flatMap(({ field, message }) => {
    if (field === AVAILABILITY_INPUT) {
      return AVAILABILITY_COUNT_FIELDS.map((name) => ({
        field: name,
        message,
      }));
    }

    return [
      {
        field: field.startsWith(AVAILABILITY_FIELD_PREFIX)
          ? field.slice(AVAILABILITY_FIELD_PREFIX.length)
          : field,
        message,
      },
    ];
  });
}
