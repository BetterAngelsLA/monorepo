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
  operatingHours: [],

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
  intakeHours: [],
  curfew: '',
  onSiteSecurity: null,
  visitorsAllowed: null,
  exitPolicy: [],
  exitPolicyOther: '',
  emergencySurge: null,
  otherRules: '',

  // Services Offered
  immediateNeeds: [],
  generalServices: [],
  healthServices: [],
  trainingServices: [],
  mealServices: [],
  otherServices: '',

  // Entry Requirements
  entryRequirements: [],
  referralRequirement: [],
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
