import {
  DemographicChoices,
  ExitPolicyChoices,
  FunderChoices,
  HealthServiceChoices,
  ImmediateNeedChoices,
  MealServiceChoices,
  ReferralRequirementChoices,
  RoomStyleChoices,
  ShelterChoices,
  ShelterProgramChoices,
  SpaChoices,
  SpecialSituationRestrictionChoices,
  StatusChoices,
  TrainingServiceChoices,
  enumDisplayAccessibilityChoices,
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

// ---------------------------------------------------------------------------
// Shared option type
// ---------------------------------------------------------------------------

export interface SelectOption<T = string> {
  value: T;
  label: string;
}

export type CheckboxOption<T extends string = string> = SelectOption<T>;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const toOptions = <T extends string>(
  labels: Record<T, string>,
  lastValues: T[] = []
): CheckboxOption<T>[] => {
  const entries = Object.entries(labels) as [T, string][];
  const tail = new Set(lastValues);
  const main = entries.filter(([value]) => !tail.has(value));
  const end = entries.filter(([value]) => tail.has(value));
  return [...main, ...end].map(([value, label]) => ({ value, label }));
};

// ---------------------------------------------------------------------------
// Label records (only where shared lib doesn't already export display maps)
// ---------------------------------------------------------------------------

const DEMOGRAPHIC_LABELS: Record<DemographicChoices, string> = {
  ...enumDisplayDemographics,
  [DemographicChoices.Other]: 'Other',
};

const SPECIAL_SITUATION_LABELS: Record<
  SpecialSituationRestrictionChoices,
  string
> = {
  ...enumDisplaySpecialSituationRestrictionChoices,
  [SpecialSituationRestrictionChoices.JusticeSystems]:
    'Persons Exiting Justice Systems',
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
  [ExitPolicyChoices.Mitigation]:
    '30 Days Mitigation plan to post someone who exits',
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

const REFERRAL_REQUIREMENT_LABELS: Record<ReferralRequirementChoices, string> =
  {
    [ReferralRequirementChoices.ReferralMatched]: 'Matched Referral',
    [ReferralRequirementChoices.ReferralNonmatched]: 'Non-Matched Referral',
    [ReferralRequirementChoices.ServiceProviderSubmission]:
      'Service Provider Submission',
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

// ---------------------------------------------------------------------------
// Exported option arrays
// ---------------------------------------------------------------------------

export const DEMOGRAPHICS_OPTIONS = toOptions(DEMOGRAPHIC_LABELS, [
  DemographicChoices.Other,
]);
export const SPECIAL_SITUATION_OPTIONS = toOptions(SPECIAL_SITUATION_LABELS);
export const SHELTER_TYPES_OPTIONS = toOptions(enumDisplayShelterChoices, [
  ShelterChoices.Other,
]);
export const ROOM_STYLES_OPTIONS = toOptions(ROOM_STYLE_LABELS, [
  RoomStyleChoices.Other,
]);
export const ACCESSIBILITY_OPTIONS = toOptions(enumDisplayAccessibilityChoices);
export const STORAGE_OPTIONS = toOptions(enumDisplayStorageChoices);
export const PETS_OPTIONS = toOptions(enumDisplayPetChoices);
export const PARKING_OPTIONS = toOptions(enumDisplayParkingChoices);
export const EXIT_POLICY_OPTIONS = toOptions(EXIT_POLICY_LABELS, [
  ExitPolicyChoices.Other,
]);
export const IMMEDIATE_NEEDS_OPTIONS = toOptions(IMMEDIATE_NEEDS_LABELS);
export const GENERAL_SERVICES_OPTIONS = toOptions(
  enumDisplayGeneralServiceChoices
);
export const HEALTH_SERVICES_OPTIONS = toOptions(HEALTH_SERVICES_LABELS);
export const TRAINING_SERVICES_OPTIONS = toOptions(TRAINING_SERVICES_LABELS);
export const MEAL_SERVICES_OPTIONS = toOptions(MEAL_SERVICES_LABELS);
export const ENTRY_REQUIREMENTS_OPTIONS = toOptions(
  enumDisplayEntryRequirementChoices
);
export const REFERRAL_REQUIREMENT_OPTIONS = toOptions(
  REFERRAL_REQUIREMENT_LABELS
);
export const SPA_OPTIONS = toOptions(SPA_LABELS);
export const SHELTER_PROGRAMS_OPTIONS = toOptions(
  enumDisplayShelterProgramChoices,
  [ShelterProgramChoices.Other]
);
export const FUNDERS_OPTIONS = toOptions(enumDisplayFunderChoices, [
  FunderChoices.Other,
]);
export const STATUS_OPTIONS = toOptions(STATUS_LABELS);

export const LA_CITIES_OPTIONS = [
  { value: 'Los Angeles', label: 'Los Angeles' },
  { value: 'Pasadena', label: 'Pasadena' },
  { value: 'Long Beach', label: 'Long Beach' },
  { value: 'Glendale', label: 'Glendale' },
  { value: 'Santa Monica', label: 'Santa Monica' },
  { value: 'Burbank', label: 'Burbank' },
  { value: 'Pomona', label: 'Pomona' },
  { value: 'Torrance', label: 'Torrance' },
  { value: 'Inglewood', label: 'Inglewood' },
  { value: 'El Monte', label: 'El Monte' },
  { value: 'Downey', label: 'Downey' },
  { value: 'West Covina', label: 'West Covina' },
  { value: 'Norwalk', label: 'Norwalk' },
  { value: 'Compton', label: 'Compton' },
] as const;

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
  ...Array.from({ length: 5 }, (_, i) => ({ value: i + 1, label: `${i + 1}` })),
] as const;

export const OVERALL_RATING_OPTIONS = [
  { value: null, label: 'None' },
  { value: 1, label: '1' },
  { value: 2, label: '2' },
  { value: 3, label: '3' },
  { value: 4, label: '4' },
  { value: 5, label: '5' },
] as const;
