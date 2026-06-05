import type {
  AccessibilityChoices,
  BedStatusChoices,
  BedTypeChoices,
  DemographicChoices,
  FunderChoices,
  MedicalNeedChoices,
  PetChoices,
} from '../../../apollo/graphql/__generated__/types';

export interface BedFormData {
  accessibility: AccessibilityChoices[];
  b7: boolean;
  demographics: DemographicChoices[];
  fees: number | null;
  funders: FunderChoices[];
  maintenanceFlag: boolean;
  medicalNeeds: MedicalNeedChoices[];
  name: string;
  pets: PetChoices[];
  roomId: string | null;
  status: BedStatusChoices;
  statusNotes: string;
  storage: boolean;
  type: BedTypeChoices | null;
}
