import {
  AccessibilityChoices,
  CityChoices,
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
import {
  enumDisplayAccessibilityChoices,
  enumDisplayCityChoices,
  enumDisplayDemographics,
  enumDisplayEntryRequirementChoices,
  enumDisplayFunderChoices,
  enumDisplayGeneralServiceChoices,
  enumDisplayParkingChoices,
  enumDisplayPetChoices,
  enumDisplayShelterChoices,
  enumDisplayShelterProgramChoices,
  enumDisplaySpecialSituationRestrictionChoices,
  enumDisplayStorageChoices,
} from '@monorepo/react/shelter';

export interface ShelterFormData {
  // Basic Information
  name: string;
  organization: string; // List selection from existing organizations
  location: string; // Format: "<search query>, <latitude>, <longitude>"
  email: string;
  phone: string;
  website: string;
  instagram: string;
  facebook: string;
  other_social_media: string;
  operating_hours: string; // Format: "HH:MM:SS-HH:MM:SS,HH:MM:SS-HH:MM:SS,..."

  // Summary Information
  demographics: DemographicChoices[];
  demographics_other: string;
  special_situation_restrictions: SpecialSituationRestrictionChoices[];
  shelter_types: ShelterChoices[];
  shelter_types_other: string;
  description: string;

  // Sleeping Details
  total_beds: number | null;
  room_styles: RoomStyleChoices[];
  room_styles_other: string;
  add_notes_sleeping_details: string;

  // Shelter Details
  accessibility: AccessibilityChoices[];
  storage: StorageChoices[];
  pets: PetChoices[];
  parking: ParkingChoices[];
  add_notes_shelter_details: string;

  // Policies
  max_stay: number | null;
  intake_hours: string; // Format: "HH:MM:SS-HH:MM:SS,HH:MM:SS-HH:MM:SS,..."
  curfew: string; // Format: "HH:MM:SS-HH:MM:SS,HH:MM:SS-HH:MM:SS,..."
  on_site_security: boolean | null;
  visitors_allowed: boolean | null;
  exit_policy: ExitPolicyChoices[];
  exit_policy_other: string;
  emergency_surge: boolean | null;
  other_rules: string;
  agreement_form: File | null; // Media upload

  // Services Offered
  immediate_needs: ImmediateNeedChoices[];
  general_services: GeneralServiceChoices[];
  health_services: HealthServiceChoices[];
  training_services: TrainingServiceChoices[];
  meal_services: MealServiceChoices[];
  other_services: string;

  // Entry Requirements
  entry_requirements: EntryRequirementChoices[];
  referral_requirement: ReferralRequirementChoices[];
  bed_fees: string;
  program_fees: string;
  entry_info: string;

  // Ecosystem Information
  cities: CityChoices[];
  spa: SpaChoices[];
  city_council_district: number | null;
  supervisorial_district: number | null;
  shelter_programs: ShelterProgramChoices[];
  shelter_programs_other: string;
  funders: FunderChoices[];
  funders_other: string;

  // Better Angels Review
  overall_rating: number | null;
  subjective_review: string;

  // Better Angels Administration
  status: StatusChoices;
  updated_at?: string; // Read-only
  updated_by?: string; // Read-only

  // Media
  hero_image: File | null;
  exterior_photos: File[];
  interior_photos: File[];
  videos: File[];
}

// Helper type for select/checkbox options
export type SelectOption<T = string> = {
  value: T;
  label: string;
};

export type CheckboxOption<T extends string = string> = SelectOption<T>;

const toOptions = <T extends string>(labels: Record<T, string>): CheckboxOption<T>[] =>
  Object.entries(labels).map(([value, label]) => ({
    value: value as T,
    label,
  }));

const DEMOGRAPHIC_LABELS: Record<DemographicChoices, string> = {
  ...enumDisplayDemographics,
  [DemographicChoices.Other]: 'Other',
};

const SPECIAL_SITUATION_LABELS: Record<SpecialSituationRestrictionChoices, string> = {
  ...enumDisplaySpecialSituationRestrictionChoices,
  [SpecialSituationRestrictionChoices.JusticeSystems]: 'Persons Exiting Justice Systems',
};

const ROOM_STYLE_LABELS: Record<RoomStyleChoices, string> = {
  [RoomStyleChoices.Congregate]: 'Congregate (Open)',
  [RoomStyleChoices.CubicleHighWalls]: 'Cubicle (High Walls)',
  [RoomStyleChoices.CubicleLowWalls]: 'Cubicle (Low Walls)',
  [RoomStyleChoices.HighBunk]: 'High Bunk',
  [RoomStyleChoices.LowBunk]: 'Low Bunk',
  [RoomStyleChoices.MotelRoom]: 'Motel Room',
  [RoomStyleChoices.Other]: 'Other',
  [RoomStyleChoices.SharedRooms]: 'Shared Rooms',
  [RoomStyleChoices.SingleRoom]: 'Single Room',
};

const EXIT_POLICY_LABELS: Record<ExitPolicyChoices, string> = {
  [ExitPolicyChoices.Mia]: 'Exit after 72 hours of being MIA',
  [ExitPolicyChoices.Violence]: 'Exit due to violence to self and others',
  [ExitPolicyChoices.Mitigation]: '30 Days Mitigation plan to post someone who exits',
  [ExitPolicyChoices.Other]: 'Other',
};

const IMMEDIATE_NEEDS_LABELS: Record<ImmediateNeedChoices, string> = {
  [ImmediateNeedChoices.Clothing]: 'Clothing',
  [ImmediateNeedChoices.Food]: 'Food',
  [ImmediateNeedChoices.Showers]: 'Showers',
};

const HEALTH_SERVICES_LABELS: Record<HealthServiceChoices, string> = {
  [HealthServiceChoices.Dental]: 'Dental',
  [HealthServiceChoices.Medical]: 'Medical',
  [HealthServiceChoices.MentalHealth]: 'Mental Health',
  [HealthServiceChoices.SubstanceUseTreatment]: 'Substance Use Treatment',
};

const TRAINING_SERVICES_LABELS: Record<TrainingServiceChoices, string> = {
  [TrainingServiceChoices.JobTraining]: 'Job Training',
  [TrainingServiceChoices.LifeSkillsTraining]: 'Life Skills Training',
  [TrainingServiceChoices.Tutoring]: 'Tutoring',
};

const MEAL_SERVICES_LABELS: Record<MealServiceChoices, string> = {
  [MealServiceChoices.Breakfast]: 'Breakfast',
  [MealServiceChoices.Lunch]: 'Lunch',
  [MealServiceChoices.Dinner]: 'Dinner',
};

const REFERRAL_REQUIREMENT_LABELS: Record<ReferralRequirementChoices, string> = {
  [ReferralRequirementChoices.ReferralMatched]: 'Matched Referral',
  [ReferralRequirementChoices.ReferralNonmatched]: 'Non-Matched Referral',
  [ReferralRequirementChoices.ServiceProviderSubmission]: 'Service Provider Submission',
  [ReferralRequirementChoices.SelfReferral]: 'Self Referral Option',
  [ReferralRequirementChoices.SameDayIntake]: 'Same Day Intake',
};

const SPA_LABELS: Record<SpaChoices, string> = {
  [SpaChoices.One]: '1 – Antelope Valley',
  [SpaChoices.Two]: '2 – San Fernando',
  [SpaChoices.Three]: '3 – San Gabriel',
  [SpaChoices.Four]: '4 – Metro',
  [SpaChoices.Five]: '5 – West',
  [SpaChoices.Six]: '6 – South',
  [SpaChoices.Seven]: '7 – East',
  [SpaChoices.Eight]: '8 – South Bay/Harbor',
};

const STATUS_LABELS: Record<StatusChoices, string> = {
  [StatusChoices.Draft]: 'Draft',
  [StatusChoices.Pending]: 'Pending',
  [StatusChoices.Approved]: 'Approved',
  [StatusChoices.Inactive]: 'Inactive',
};

export const DEMOGRAPHICS_OPTIONS = toOptions(DEMOGRAPHIC_LABELS);
export const SPECIAL_SITUATION_OPTIONS = toOptions(SPECIAL_SITUATION_LABELS);
export const SHELTER_TYPES_OPTIONS = toOptions(enumDisplayShelterChoices);
export const ROOM_STYLES_OPTIONS = toOptions(ROOM_STYLE_LABELS);
export const ACCESSIBILITY_OPTIONS = toOptions(enumDisplayAccessibilityChoices);
export const STORAGE_OPTIONS = toOptions(enumDisplayStorageChoices);
export const PETS_OPTIONS = toOptions(enumDisplayPetChoices);
export const PARKING_OPTIONS = toOptions(enumDisplayParkingChoices);
export const EXIT_POLICY_OPTIONS = toOptions(EXIT_POLICY_LABELS);
export const IMMEDIATE_NEEDS_OPTIONS = toOptions(IMMEDIATE_NEEDS_LABELS);
export const GENERAL_SERVICES_OPTIONS = toOptions(enumDisplayGeneralServiceChoices);
export const HEALTH_SERVICES_OPTIONS = toOptions(HEALTH_SERVICES_LABELS);
export const TRAINING_SERVICES_OPTIONS = toOptions(TRAINING_SERVICES_LABELS);
export const MEAL_SERVICES_OPTIONS = toOptions(MEAL_SERVICES_LABELS);
export const ENTRY_REQUIREMENTS_OPTIONS = toOptions(enumDisplayEntryRequirementChoices);
export const REFERRAL_REQUIREMENT_OPTIONS = toOptions(REFERRAL_REQUIREMENT_LABELS);
export const SPA_OPTIONS = toOptions(SPA_LABELS);
export const LA_CITIES_OPTIONS = toOptions(enumDisplayCityChoices);
export const SHELTER_PROGRAMS_OPTIONS = toOptions(enumDisplayShelterProgramChoices);
export const FUNDERS_OPTIONS = toOptions(enumDisplayFunderChoices);
export const STATUS_OPTIONS = toOptions(STATUS_LABELS);

export const BOOLEAN_OPTIONS = [
  { value: null, label: 'Unknown' },
  { value: true, label: 'Yes' },
  { value: false, label: 'No' },
] as const;

export const CITY_COUNCIL_DISTRICT_OPTIONS = [
  { value: null, label: 'None' },
  ...Array.from({ length: 15 }, (_, i) => ({
    value: i + 1,
    label: `${i + 1}`,
  })),
] as const;

export const SUPERVISORIAL_DISTRICT_OPTIONS = [
  { value: null, label: 'None' },
  ...Array.from({ length: 5 }, (_, i) => ({
    value: i + 1,
    label: `${i + 1}`,
  })),
] as const;

export const OVERALL_RATING_OPTIONS = [
  { value: null, label: 'None' },
  { value: 1, label: '1' },
  { value: 2, label: '2' },
  { value: 3, label: '3' },
  { value: 4, label: '4' },
  { value: 5, label: '5' },
] as const;
