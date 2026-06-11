import { z } from 'zod';
import {
  AccessibilityChoices,
  BedStatusChoices,
  BedTypeChoices,
  DemographicChoices,
  FunderChoices,
  MedicalNeedChoices,
  PetChoices,
} from '../../../../apollo/graphql/__generated__/types';

export const formSchema = z.object({
  name: z.string(),
  roomId: z.string().nullable(),
  status: z.enum(BedStatusChoices),
  statusNotes: z.string(),
  type: z.enum(BedTypeChoices).nullable(),
  medicalNeeds: z.array(z.enum(MedicalNeedChoices)),
  demographics: z.array(z.enum(DemographicChoices)),
  accessibility: z.array(z.enum(AccessibilityChoices)),
  funders: z.array(z.enum(FunderChoices)),
  pets: z.array(z.enum(PetChoices)),
  storage: z.boolean(),
  maintenanceFlag: z.boolean(),
  b7: z.boolean(),
  fees: z
    .number()
    .int('Fees must be a whole number')
    .min(0, 'Fees must be zero or greater')
    .nullable(),
});
