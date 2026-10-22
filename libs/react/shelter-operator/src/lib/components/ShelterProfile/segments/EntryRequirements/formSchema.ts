import {
  EntryRequirementChoices,
  ReferralRequirementChoices,
  VaccinationRequirementChoices,
} from '@monorepo/react/shelter';
import { z } from 'zod';
import { toDropdownValues } from '../../../base-ui/dropdown';
import { ShelterProfileType } from '../../types';

export const formSchema = z.object({
  entryRequirements: z.array(z.enum(EntryRequirementChoices)),
  referralRequirement: z.array(z.enum(ReferralRequirementChoices)),
  vaccinationRequirement: z.array(z.enum(VaccinationRequirementChoices)),
  bedFees: z.string(),
  programFees: z.string(),
  entryInfo: z.string(),
});

export type EntryRequirementsFormData = z.infer<typeof formSchema>;

export const formFieldNames = Object.keys(formSchema.shape);

export const defaultFormValues: EntryRequirementsFormData = {
  entryRequirements: [],
  referralRequirement: [],
  vaccinationRequirement: [],
  bedFees: '',
  programFees: '',
  entryInfo: '',
};

export function toFormData(
  shelter: ShelterProfileType,
): EntryRequirementsFormData {
  return {
    entryRequirements: toDropdownValues(shelter.entryRequirements),
    referralRequirement: toDropdownValues(shelter.referralRequirement),
    vaccinationRequirement: toDropdownValues(shelter.vaccinationRequirement),
    bedFees: shelter.bedFees ?? '',
    programFees: shelter.programFees ?? '',
    entryInfo: shelter.entryInfo ?? '',
  };
}
