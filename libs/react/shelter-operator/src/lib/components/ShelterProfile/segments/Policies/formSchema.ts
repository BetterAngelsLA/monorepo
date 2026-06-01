import { ExitPolicyChoices } from '@monorepo/react/shelter';
import { z } from 'zod';
import { toDropdownValues } from '../../../base-ui/dropdown';
import { ShelterProfileType } from '../../types';

export const formSchema = z.object({
  maxStay: z
    .number()
    .int('Max stay must be a whole number')
    .min(0, 'Max stay must be zero or greater')
    .nullable()
    .optional(),
  onSiteSecurity: z.boolean().nullable().optional(),
  visitorsAllowed: z.boolean().nullable().optional(),
  emergencySurge: z.boolean().nullable().optional(),
  exitPolicy: z.array(z.enum(ExitPolicyChoices)),
  otherRules: z.string().nullable().optional(),
});

export type PoliciesFormData = z.infer<typeof formSchema>;

export const defaultFormValues: PoliciesFormData = {
  maxStay: undefined,
  onSiteSecurity: undefined,
  visitorsAllowed: undefined,
  emergencySurge: undefined,
  exitPolicy: [],
  otherRules: undefined,
};

export function toFormData(shelter: ShelterProfileType): PoliciesFormData {
  return {
    maxStay: shelter.maxStay,
    onSiteSecurity: shelter.onSiteSecurity,
    visitorsAllowed: shelter.visitorsAllowed,
    emergencySurge: shelter.emergencySurge,
    otherRules: shelter.otherRules,
    exitPolicy: toDropdownValues(shelter.exitPolicy),
  };
}
