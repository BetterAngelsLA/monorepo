import {
  CreateShelterDocument,
  type CreateShelterInput,
  type CreateShelterMutation,
  type CreateShelterMutationVariables,
  type ScheduleInput,
  type ServiceInput,
} from '@monorepo/react/shelter';
import type { ScheduleFormEntry, ShelterFormData } from '../../../formTypes';
import { sanitizeString } from '../utils/formUtils';

export { CreateShelterDocument as CREATE_SHELTER_MUTATION };
export type {
  CreateShelterMutation as CreateShelterMutationResult,
  CreateShelterMutationVariables,
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const compactEnumValues = <T extends string>(values: readonly T[]): T[] =>
  Array.from(new Set(values.filter(Boolean)));

const buildServices = (
  selectedIds: readonly string[],
  pendingByCategory: Readonly<Record<string, string[]>>
): ServiceInput[] | undefined => {
  const entries: ServiceInput[] = [];
  const seenIds = new Set<string>();
  const seenPending = new Set<string>();

  for (const id of selectedIds) {
    if (id && !seenIds.has(id)) {
      seenIds.add(id);
      entries.push({ id });
    }
  }

  for (const [categoryId, displayNames] of Object.entries(pendingByCategory)) {
    if (!categoryId) continue;
    for (const displayName of displayNames) {
      const trimmed = displayName.trim();
      if (!trimmed) continue;
      const dedupeKey = `${categoryId}::${trimmed.toLowerCase()}`;
      if (seenPending.has(dedupeKey)) continue;
      seenPending.add(dedupeKey);
      entries.push({ categoryId, displayName: trimmed });
    }
  }

  return entries.length ? entries : undefined;
};

const numberOrUndefined = (value: number | null | undefined) =>
  typeof value === 'number' && !Number.isNaN(value) ? value : undefined;

/** Normalise a time string ("HH:MM" or "HH:MM:SS") to "HH:MM:SS", or return undefined. */
const timeOrUndefined = (
  value: string | null | undefined
): string | undefined => {
  const trimmed = value?.trim();
  if (!trimmed) return undefined;
  // Accept HH:MM or HH:MM:SS
  if (/^\d{2}:\d{2}$/.test(trimmed)) return `${trimmed}:00`;
  if (/^\d{2}:\d{2}:\d{2}$/.test(trimmed)) return trimmed;
  return undefined;
};

/** Ensure a URL has a scheme, or return undefined if empty. */
const urlOrUndefined = (
  value: string | null | undefined
): string | undefined => {
  const trimmed = value?.trim();
  if (!trimmed) return undefined;
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
};

/** Convert form schedule entries to the GraphQL input shape. */
const buildScheduleInputs = (
  entries: ScheduleFormEntry[]
): ScheduleInput[] | undefined => {
  const mapped = entries
    .filter((e) => e.startTime && e.endTime)
    .map(
      (e): ScheduleInput => ({
        scheduleType: e.scheduleType || undefined,
        days: e.days.length ? e.days : undefined,
        startTime: timeOrUndefined(e.startTime),
        endTime: timeOrUndefined(e.endTime),
        startDate: e.startDate || undefined,
        endDate: e.endDate || undefined,
        condition: e.condition || undefined,
        isException: e.isException,
      })
    );
  return mapped.length ? mapped : undefined;
};

// ---------------------------------------------------------------------------
// Build the mutation input from form state
// ---------------------------------------------------------------------------

export const buildCreateShelterInput = (
  formData: ShelterFormData,
  organizationId: string
): CreateShelterInput => {
  return {
    // Required
    name: formData.name.trim(),
    description: formData.description.trim(),

    // Organization
    organization: organizationId,

    // M2M enum arrays
    accessibility: compactEnumValues(formData.accessibility),
    demographics: compactEnumValues(formData.demographics),
    specialSituationRestrictions: compactEnumValues(
      formData.specialSituationRestrictions
    ),
    shelterTypes: compactEnumValues(formData.shelterTypes),
    roomStyles: compactEnumValues(formData.roomStyles),
    storage: compactEnumValues(formData.storage),
    pets: compactEnumValues(formData.pets),
    parking: compactEnumValues(formData.parking),
    services: buildServices(
      formData.services,
      formData.pendingServicesByCategory
    ),
    entryRequirements: compactEnumValues(formData.entryRequirements),
    referralRequirement: compactEnumValues(formData.referralRequirement),
    exitPolicy: compactEnumValues(formData.exitPolicy),
    cityId: formData.city ? formData.city?.id : undefined,
    spa: formData.spa ?? undefined,
    shelterPrograms: compactEnumValues(formData.shelterPrograms),
    funders: compactEnumValues(formData.funders),

    // Optional strings
    email: sanitizeString(formData.email),
    phone: sanitizeString(formData.phone),
    website: urlOrUndefined(formData.website),
    instagram: sanitizeString(formData.instagram),
    otherRules: sanitizeString(formData.otherRules),
    otherServices: sanitizeString(formData.otherServices),
    entryInfo: sanitizeString(formData.entryInfo),
    bedFees: sanitizeString(formData.bedFees),
    programFees: sanitizeString(formData.programFees),
    demographicsOther: sanitizeString(formData.demographicsOther),
    shelterTypesOther: sanitizeString(formData.shelterTypesOther),
    roomStylesOther: sanitizeString(formData.roomStylesOther),
    addNotesSleepingDetails: sanitizeString(formData.addNotesSleepingDetails),
    addNotesShelterDetails: sanitizeString(formData.addNotesShelterDetails),
    exitPolicyOther: sanitizeString(formData.exitPolicyOther),
    shelterProgramsOther: sanitizeString(formData.shelterProgramsOther),
    fundersOther: sanitizeString(formData.fundersOther),
    subjectiveReview: sanitizeString(formData.subjectiveReview),

    // Optional enums / booleans / numbers
    status: formData.status || undefined,
    onSiteSecurity: formData.onSiteSecurity ?? undefined,
    visitorsAllowed: formData.visitorsAllowed ?? undefined,
    emergencySurge: formData.emergencySurge ?? undefined,
    totalBeds: numberOrUndefined(formData.totalBeds),
    maxStay: numberOrUndefined(formData.maxStay),
    cityCouncilDistrict: formData.cityCouncilDistrict ?? undefined,
    supervisorialDistrict: formData.supervisorialDistrict ?? undefined,
    overallRating: formData.overallRating ?? undefined,
    curfew: timeOrUndefined(formData.curfew),

    // Structured types — passed directly, no parsing needed
    location: formData.location ?? undefined,
    schedules: buildScheduleInputs(formData.schedules),
  };
};
