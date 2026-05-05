import { StatusChoices } from '@monorepo/react/shelter';
import type { ShelterFormData } from '../../../formTypes';

/**
 * Provide a fresh copy of the shelter form defaults so callers avoid
 * accidentally sharing mutable objects such as arrays between renders.
 */
export const createEmptyShelterFormData = (): ShelterFormData => ({
  // Basic Information
  name: '',
  organization: '',
  location: null,
  email: '',
  phone: '',
  website: '',
  instagram: '',

  // Schedules
  schedules: [],

  // Summary Information
  demographics: [],
  demographicsOther: '',
  specialSituationRestrictions: [],
  shelterTypes: [],
  shelterTypesOther: '',
  description: '',

  // Sleeping Details
  totalBeds: null,
  roomStyles: [],
  roomStylesOther: '',
  addNotesSleepingDetails: '',

  // Shelter Details
  accessibility: [],
  storage: [],
  pets: [],
  parking: [],
  addNotesShelterDetails: '',

  // Policies
  maxStay: null,
  curfew: '',
  onSiteSecurity: null,
  visitorsAllowed: null,
  exitPolicy: [],
  exitPolicyOther: '',
  emergencySurge: null,
  otherRules: '',

  // Services Offered
  services: [],
  pendingServicesByCategory: {} as Record<string, string[]>,
  otherServices: '',

  // Entry Requirements
  entryRequirements: [],
  referralRequirement: [],
  vaccinationRequirement: [],
  bedFees: '',
  programFees: '',
  entryInfo: '',

  // Ecosystem Information
  cities: [],
  spa: [],
  cityCouncilDistrict: null,
  supervisorialDistrict: null,
  shelterPrograms: [],
  shelterProgramsOther: '',
  funders: [],
  fundersOther: '',

  // Better Angels Review
  overallRating: null,
  subjectiveReview: '',

  // Administration
  status: StatusChoices.Draft,
});
