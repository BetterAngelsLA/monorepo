import { ShelterFormData, STATUS_OPTIONS } from '../../../types';

/**
 * Provide a fresh copy of the shelter form defaults so callers avoid
 * accidentally sharing mutable objects such as arrays between renders.
 */
export const createEmptyShelterFormData = (): ShelterFormData => ({
  // Basic Information
  name: '',
  organization: '',
  location: '',
  email: '',
  phone: '',
  website: '',
  instagram: '',
  facebook: '',
  other_social_media: '',
  operating_hours: '',

  // Summary Information
  demographics: [],
  demographics_other: '',
  special_situation_restrictions: [],
  shelter_types: [],
  shelter_types_other: '',
  description: '',

  // Sleeping Details
  total_beds: 0,
  room_styles: [],
  room_styles_other: '',
  add_notes_sleeping_details: '',

  // Shelter Details
  accessibility: [],
  storage: [],
  pets: [],
  parking: [],
  add_notes_shelter_details: '',

  // Policies
  max_stay: 0,
  intake_hours: '',
  curfew: '',
  on_site_security: null,
  visitors_allowed: null,
  exit_policy: [],
  exit_policy_other: '',
  emergency_surge: null,
  other_rules: '',
  agreement_form: null,

  // Services Offered
  immediate_needs: [],
  general_services: [],
  health_services: [],
  training_services: [],
  meal_services: [],
  other_services: '',

  // Entry Requirements
  entry_requirements: [],
  referral_requirement: [],
  bed_fees: '',
  program_fees: '',
  entry_info: '',

  // Ecosystem Information
  cities: [],
  spa: [],
  city_council_district: null,
  supervisorial_district: null,
  shelter_programs: [],
  shelter_programs_other: '',
  funders: [],
  funders_other: '',

  // Better Angels Review
  overall_rating: null,
  subjective_review: '',

  // Better Angels Administration
  status: STATUS_OPTIONS[0] ?? 'Draft',

  // Media
  hero_image: null,
  exterior_photos: [],
  interior_photos: [],
  videos: [],
});
