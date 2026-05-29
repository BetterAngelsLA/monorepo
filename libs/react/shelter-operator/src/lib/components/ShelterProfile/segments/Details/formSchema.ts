import { AccessibilityChoices } from '@monorepo/react/shelter';
import { z } from 'zod';
import { GetShelterQuery } from '../../../../graphql/__generated__/getShelter.generated';
import { toDropdownValues } from '../../../base-ui/dropdown';
// import { Shelter } from '../../../../types/shelter';

// export const ACCESSIBILITY_OPTIONS = toOptions(enumDisplayAccessibilityChoices);

export const detailsFormSchema = z.object({
  accessibility: z.array(z.enum(AccessibilityChoices)),
});

export type DetailsFormData = z.infer<typeof detailsFormSchema>;

export const detailsDefaultValues: DetailsFormData = {
  accessibility: [],
};

type Shelter = GetShelterQuery['shelter'];
// type Shelter = ShelterType;

export function toFormData(shelter: Shelter): DetailsFormData {
  return {
    accessibility: toDropdownValues(shelter.accessibility),
  };
}
