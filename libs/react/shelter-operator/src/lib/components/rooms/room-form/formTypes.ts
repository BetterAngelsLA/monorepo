import type {
  AccessibilityChoices,
  DemographicChoices,
  FunderChoices,
  PetChoices,
  RoomStatusChoices,
  RoomStyleChoices,
} from '../../../apollo/graphql/__generated__/types';

export interface RoomFormData {
  accessibility: AccessibilityChoices[];
  amenities: string;
  demographics: DemographicChoices[];
  funders: FunderChoices[];
  maintenanceFlag: boolean;
  medicalRespite: boolean;
  name: string;
  notes: string;
  pets: PetChoices[];
  status: RoomStatusChoices;
  storage: boolean;
  type: RoomStyleChoices | null;
  typeOther: string;
}
