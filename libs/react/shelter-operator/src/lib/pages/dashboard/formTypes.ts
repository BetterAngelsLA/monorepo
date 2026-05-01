import type {
  AccessibilityChoices,
  CityType,
  ConditionChoices,
  DayOfWeekChoices,
  DemographicChoices,
  EntryRequirementChoices,
  ExitPolicyChoices,
  FunderChoices,
  ParkingChoices,
  PetChoices,
  ReferralRequirementChoices,
  RoomStyleChoices,
  ScheduleTypeChoices,
  ShelterChoices,
  ShelterProgramChoices,
  SpaChoices,
  SpecialSituationRestrictionChoices,
  StatusChoices,
  StorageChoices,
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

export interface ScheduleFormEntry {
  scheduleType: ScheduleTypeChoices;
  days: DayOfWeekChoices[];
  startTime: string; // "HH:MM" or "HH:MM:SS"
  endTime: string; // "HH:MM" or "HH:MM:SS"
  startDate: string; // "YYYY-MM-DD" or ""
  endDate: string; // "YYYY-MM-DD" or ""
  condition: ConditionChoices | '';
  isException: boolean;
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

  // Schedules (operating hours, intake hours, etc.)
  schedules: ScheduleFormEntry[];

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
  curfew: string; // single Time value "HH:MM:SS" (backend is TimeField)
  onSiteSecurity: boolean | null;
  visitorsAllowed: boolean | null;
  exitPolicy: ExitPolicyChoices[];
  exitPolicyOther: string;
  emergencySurge: boolean | null;
  otherRules: string;

  // Services Offered
  services: string[];
  pendingServicesByCategory: Record<string, string[]>;
  otherServices: string;

  // Entry Requirements
  entryRequirements: EntryRequirementChoices[];
  referralRequirement: ReferralRequirementChoices[];
  bedFees: string;
  programFees: string;
  entryInfo: string;

  // Ecosystem Information
  city: CityType | null;
  spa: SpaChoices | null;
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
