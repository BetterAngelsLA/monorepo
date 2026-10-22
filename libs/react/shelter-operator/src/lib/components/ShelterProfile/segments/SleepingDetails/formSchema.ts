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
  roomStyles: z.array(z.enum(RoomStyleChoices)),
  roomStylesOther: z.string().trim().nullable().optional(),
  addNotesSleepingDetails: z.string(),
});

export const formSchema = baseSchema.superRefine((data, ctx) => {
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
});

export type SleepingDetailsFormData = z.infer<typeof formSchema>;

export const formFieldNames = Object.keys(baseSchema.shape);

export const defaultFormValues: SleepingDetailsFormData = {
  totalBeds: undefined,
  roomStyles: [],
  roomStylesOther: undefined,
  addNotesSleepingDetails: '',
};

export function toFormData(
  shelter: ShelterProfileType,
): SleepingDetailsFormData {
  return {
    totalBeds: shelter.totalBeds,
    roomStyles: toDropdownValues(shelter.roomStyles),
    roomStylesOther: shelter.roomStylesOther,
    addNotesSleepingDetails: shelter.addNotesSleepingDetails ?? '',
  };
}
