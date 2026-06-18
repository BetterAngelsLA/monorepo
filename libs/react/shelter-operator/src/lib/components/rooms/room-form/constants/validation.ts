import { z } from 'zod';
import {
  AccessibilityChoices,
  DemographicChoices,
  FunderChoices,
  PetChoices,
  RoomStatusChoices,
  RoomStyleChoices,
} from '../../../../apollo/graphql/__generated__/types';

export const formSchema = z.object({
  name: z.string().trim().min(1, 'Room name is required'),
  status: z.enum(RoomStatusChoices),
  type: z.enum(RoomStyleChoices).nullable(),
  typeOther: z.string(),
  notes: z.string(),
  amenities: z.string(),
  medicalRespite: z.boolean(),
  demographics: z.array(z.enum(DemographicChoices)),
  accessibility: z.array(z.enum(AccessibilityChoices)),
  funders: z.array(z.enum(FunderChoices)),
  pets: z.array(z.enum(PetChoices)),
  storage: z.boolean(),
  maintenanceFlag: z.boolean(),
});
