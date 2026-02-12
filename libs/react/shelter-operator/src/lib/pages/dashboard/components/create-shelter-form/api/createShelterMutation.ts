import {
  CreateShelterDocument,
  type CreateShelterInput as GeneratedCreateShelterInput,
  type CreateShelterMutation,
  type CreateShelterMutationVariables as GeneratedCreateShelterMutationVariables,
} from '@monorepo/react/shelter';
import type { ShelterFormData } from '../../../types';
import { compactEnumValues } from '../utils/enumMappings';
import { parseLocation, sanitizeString } from '../utils/formUtils';

export const CREATE_SHELTER_MUTATION = CreateShelterDocument;
export type CreateShelterMutationResult = CreateShelterMutation;
export type CreateShelterMutationVariables = GeneratedCreateShelterMutationVariables;

type ExtendedCreateShelterInput = GeneratedCreateShelterInput & {
  operatingHours?: { start?: string | null; end?: string | null }[];
  intakeHours?: { start?: string | null; end?: string | null }[];
};

export type CreateShelterInput = ExtendedCreateShelterInput;

const numberOrUndefined = (value: number | null | undefined) =>
  typeof value === 'number' && !Number.isNaN(value) ? value : undefined;

const parseOperatingHours = (value: string): { start: string; end: string }[] => {
  if (!value) return [];
  return value
    .split(',')
    .map(range => range.trim())
    .filter(Boolean)
    .map(range => {
      const [start, end] = range.split('-').map(part => part.trim());
      return { start, end };
    })
    .filter(item => item.start && item.end);
};

export const buildCreateShelterInput = (formData: ShelterFormData): ExtendedCreateShelterInput => {
  const input: Partial<ExtendedCreateShelterInput> = {
    name: formData.name.trim(),
    description: formData.description.trim(),
    accessibility: compactEnumValues(formData.accessibility),
    demographics: compactEnumValues(formData.demographics),
    specialSituationRestrictions: compactEnumValues(formData.special_situation_restrictions),
    shelterTypes: compactEnumValues(formData.shelter_types),
    roomStyles: compactEnumValues(formData.room_styles),
    storage: compactEnumValues(formData.storage),
    pets: compactEnumValues(formData.pets),
    parking: compactEnumValues(formData.parking),
    immediateNeeds: compactEnumValues(formData.immediate_needs),
    generalServices: compactEnumValues(formData.general_services),
    healthServices: compactEnumValues(formData.health_services),
    trainingServices: compactEnumValues(formData.training_services),
    mealServices: compactEnumValues(formData.meal_services),
    entryRequirements: compactEnumValues(formData.entry_requirements),
    referralRequirement: compactEnumValues(formData.referral_requirement),
    exitPolicy: compactEnumValues(formData.exit_policy),
    cities: compactEnumValues(formData.cities),
    spa: compactEnumValues(formData.spa),
    shelterPrograms: compactEnumValues(formData.shelter_programs),
    funders: compactEnumValues(formData.funders),
  };

  const stringFields: Record<string, string | undefined> = {
    email: sanitizeString(formData.email),
    phone: sanitizeString(formData.phone),
    website: sanitizeString(formData.website),
    instagram: sanitizeString(formData.instagram),
    otherRules: sanitizeString(formData.other_rules),
    otherServices: sanitizeString(formData.other_services),
    entryInfo: sanitizeString(formData.entry_info),
    bedFees: sanitizeString(formData.bed_fees),
    programFees: sanitizeString(formData.program_fees),
    demographicsOther: sanitizeString(formData.demographics_other),
    shelterTypesOther: sanitizeString(formData.shelter_types_other),
    roomStylesOther: sanitizeString(formData.room_styles_other),
    addNotesSleepingDetails: sanitizeString(formData.add_notes_sleeping_details),
    addNotesShelterDetails: sanitizeString(formData.add_notes_shelter_details),
    exitPolicyOther: sanitizeString(formData.exit_policy_other),
    shelterProgramsOther: sanitizeString(formData.shelter_programs_other),
    fundersOther: sanitizeString(formData.funders_other),
    subjectiveReview: sanitizeString(formData.subjective_review),
  };

  Object.entries(stringFields).forEach(([key, value]) => {
    if (value) {
      input[key as keyof GeneratedCreateShelterInput] = value as GeneratedCreateShelterInput[keyof GeneratedCreateShelterInput];
    }
  });

  if (formData.status) {
    input.status = formData.status;
  }

  const location = parseLocation(formData.location);
  if (location) {
    input.location = location;
  }

  const operatingHours = parseOperatingHours(formData.operating_hours);
  if (operatingHours.length) {
    input.operatingHours = operatingHours;
  }
  const intakeHours = parseOperatingHours(formData.intake_hours);
  if (intakeHours.length) {
    input.intakeHours = intakeHours;
  }

  const booleanFields: Record<string, boolean | null> = {
    onSiteSecurity: formData.on_site_security,
    visitorsAllowed: formData.visitors_allowed,
    emergencySurge: formData.emergency_surge,
  };

  Object.entries(booleanFields).forEach(([key, value]) => {
    if (value !== null && value !== undefined) {
      input[key as keyof GeneratedCreateShelterInput] = value as GeneratedCreateShelterInput[keyof GeneratedCreateShelterInput];
    }
  });

  const numericFields: Record<string, number | null | undefined> = {
    totalBeds: numberOrUndefined(formData.total_beds),
    maxStay: numberOrUndefined(formData.max_stay),
    cityCouncilDistrict: formData.city_council_district ?? undefined,
    supervisorialDistrict: formData.supervisorial_district ?? undefined,
    overallRating: formData.overall_rating ?? undefined,
  };

  Object.entries(numericFields).forEach(([key, value]) => {
    if (value !== undefined) {
      input[key as keyof GeneratedCreateShelterInput] = value as GeneratedCreateShelterInput[keyof GeneratedCreateShelterInput];
    }
  });

  return input as ExtendedCreateShelterInput;
};
