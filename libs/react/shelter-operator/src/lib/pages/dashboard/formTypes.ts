import type {
  AccessibilityChoices,
  DemographicChoices,
  EntryRequirementChoices,
  ExitPolicyChoices,
  FunderChoices,
  GeneralServiceChoices,
  HealthServiceChoices,
  ImmediateNeedChoices,
  MealServiceChoices,
  ParkingChoices,
  PetChoices,
  ReferralRequirementChoices,
  RoomStyleChoices,
  ShelterChoices,
  ShelterProgramChoices,
  SpaChoices,
  SpecialSituationRestrictionChoices,
  StatusChoices,
  StorageChoices,
  TrainingServiceChoices,
} from '@monorepo/react/shelter';

// ---------------------------------------------------------------------------
// Structured sub-types (replace comma-delimited strings)
// ---------------------------------------------------------------------------

export interface LocationData {
  place: string;
  latitude?: number;
  longitude?: number;
}

export interface TimeRange {
  start: string; // "HH:MM:SS"
  end: string; // "HH:MM:SS"
}

// ---------------------------------------------------------------------------
// Form state — camelCase, structured, no dead fields
// ---------------------------------------------------------------------------

export interface ShelterFormData {
  // Basic Information
  name: string;
  organization: string;
  location: LocationData | null;
  email: string;
  phone: string;
  website: string;
  instagram: string;
  operatingHours: TimeRange[];

  // Summary Information
  demographics: DemographicChoices[];
  demographicsOther: string;
  specialSituationRestrictions: SpecialSituationRestrictionChoices[];
  shelterTypes: ShelterChoices[];
  shelterTypesOther: string;
  description: string;

  // Sleeping Details
  totalBeds: number | null;
  roomStyles: RoomStyleChoices[];
  roomStylesOther: string;
  addNotesSleepingDetails: string;

  // Shelter Details
  accessibility: AccessibilityChoices[];
  storage: StorageChoices[];
  pets: PetChoices[];
  parking: ParkingChoices[];
  addNotesShelterDetails: string;

  // Policies
  maxStay: number | null;
  intakeHours: TimeRange[];
  curfew: string; // single Time value "HH:MM:SS" (backend is TimeField)
  onSiteSecurity: boolean | null;
  visitorsAllowed: boolean | null;
  exitPolicy: ExitPolicyChoices[];
  exitPolicyOther: string;
  emergencySurge: boolean | null;
  otherRules: string;

  // Services Offered
  immediateNeeds: ImmediateNeedChoices[];
  generalServices: GeneralServiceChoices[];
  healthServices: HealthServiceChoices[];
  trainingServices: TrainingServiceChoices[];
  mealServices: MealServiceChoices[];
  otherServices: string;

  // Entry Requirements
  entryRequirements: EntryRequirementChoices[];
  referralRequirement: ReferralRequirementChoices[];
  bedFees: string;
  programFees: string;
  entryInfo: string;

  // Ecosystem Information
  cities: string[];
  spa: SpaChoices[];
  cityCouncilDistrict: number | null;
  supervisorialDistrict: number | null;
  shelterPrograms: ShelterProgramChoices[];
  shelterProgramsOther: string;
  funders: FunderChoices[];
  fundersOther: string;

  // Better Angels Review
  overallRating: number | null;
  subjectiveReview: string;

  // Administration
  status: StatusChoices;
}
