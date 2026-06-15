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
  accessibility: z.array(z.enum(AccessibilityChoices)),
  b7: z.boolean(),
  demographics: z.array(z.enum(DemographicChoices)),
  fees: z
    .number()
    .int('Fees must be a whole number')
    .min(0, 'Fees must be zero or greater')
    .nullable(),
  funders: z.array(z.enum(FunderChoices)),
  maintenanceFlag: z.boolean(),
  medicalNeeds: z.array(z.enum(MedicalNeedChoices)),
  name: z.string(),
  pets: z.array(z.enum(PetChoices)),
  roomId: z.string().nullable(),
  status: z.enum(BedStatusChoices),
  statusNotes: z.string(),
  storage: z.boolean(),
  type: z.enum(BedTypeChoices).nullable(),
});
