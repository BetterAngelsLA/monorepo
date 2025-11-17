import {
  CreateShelterDocument,
  type CreateShelterMutation,
  type CreateShelterMutationVariables,
} from '@monorepo/react/shelter';
import type { ShelterFormData } from '../../../types';
import { compactEnumValues } from '../utils/enumMappings';

export const CREATE_SHELTER_MUTATION = CreateShelterDocument;
export type CreateShelterMutationResult = CreateShelterMutation;
export type CreateShelterMutationVariables = CreateShelterMutationVariables;

export type CreateShelterInput = ReturnType<typeof buildCreateShelterInput>;

const sanitizeString = (value?: string | null) => {
  if (!value) {
    return undefined;
  }

  const trimmed = value.trim();
  return trimmed.length ? trimmed : undefined;
};

const parseLocation = (value: string) => {
  const trimmed = value.trim();
  if (!trimmed) {
    return undefined;
  }

  const fragments = trimmed.split(',').map(fragment => fragment.trim());
  const [place, latitudeRaw, longitudeRaw] = fragments;
  if (!place) {
    return undefined;
  }

  const latitude = latitudeRaw ? Number(latitudeRaw) : undefined;
  const longitude = longitudeRaw ? Number(longitudeRaw) : undefined;

  return {
    place,
    ...(Number.isFinite(latitude) ? { latitude } : {}),
    ...(Number.isFinite(longitude) ? { longitude } : {}),
  };
};

const numberOrUndefined = (value: number | null | undefined) =>
  typeof value === 'number' && !Number.isNaN(value) ? value : undefined;

export const buildCreateShelterInput = (formData: ShelterFormData) => {
  const input = {
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
  } as Record<string, unknown>;

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
      input[key] = value;
    }
  });

  if (formData.status) {
    input.status = formData.status;
  }

  const location = parseLocation(formData.location);
  if (location) {
    input.location = location;
  }

  const booleanFields: Record<string, boolean | null> = {
    onSiteSecurity: formData.on_site_security,
    visitorsAllowed: formData.visitors_allowed,
    emergencySurge: formData.emergency_surge,
  };

  Object.entries(booleanFields).forEach(([key, value]) => {
    if (value !== null && value !== undefined) {
      input[key] = value;
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
      input[key] = value;
    }
  });

  return input;
};
