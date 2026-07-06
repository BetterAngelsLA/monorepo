import { z } from 'zod';
import {
  AccessibilityChoices,
  DemographicChoices,
  FunderChoices,
  PetChoices,
  RoomStyleChoices,
} from '../../../../apollo/graphql/__generated__/types';

export const formSchema = z.object({
  accessibility: z.array(z.enum(AccessibilityChoices)),
  amenities: z.string(),
  demographics: z.array(z.enum(DemographicChoices)),
  funders: z.array(z.enum(FunderChoices)),
  maintenanceFlag: z.boolean(),
  medicalRespite: z.boolean(),
  name: z.string().trim().min(1, 'Room name is required'),
  notes: z.string(),
  pets: z.array(z.enum(PetChoices)),
  storage: z.boolean(),
  type: z.enum(RoomStyleChoices).nullable(),
  typeOther: z.string(),
});
