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
  demographics: string[];
  demographics_other: string;
  special_situation_restrictions: string[];
  shelter_types: string[];
  shelter_types_other: string;
  description: string;

  // Sleeping Details
  total_beds: number | null;
  room_styles: string[];
  room_styles_other: string;
  add_notes_sleeping_details: string;

  // Shelter Details
  accessibility: string[];
  storage: string[];
  pets: string[];
  parking: string[];
  add_notes_shelter_details: string;

  // Policies
  max_stay: number | null;
  intake_hours: string; // Format: "HH:MM:SS-HH:MM:SS,HH:MM:SS-HH:MM:SS,..."
  curfew: string; // Format: "HH:MM:SS-HH:MM:SS,HH:MM:SS-HH:MM:SS,..."
  on_site_security: boolean | null;
  visitors_allowed: boolean | null;
  exit_policy: string[];
  exit_policy_other: string;
  emergency_surge: boolean | null;
  other_rules: string;
  agreement_form: File | null; // Media upload

  // Services Offered
  immediate_needs: string[];
  general_services: string[];
  health_services: string[];
  training_services: string[];
  meal_services: string[];
  other_services: string;

  // Entry Requirements
  entry_requirements: string[];
  referral_requirement: string[];
  bed_fees: string;
  program_fees: string;
  entry_info: string;

  // Ecosystem Information
  cities: string[];
  spa: string[];
  city_council_district: number | null;
  supervisorial_district: number | null;
  shelter_programs: string[];
  shelter_programs_other: string;
  funders: string[];
  funders_other: string;

  // Better Angels Review
  overall_rating: number | null;
  subjective_review: string;

  // Better Angels Administration
  status: string;
  updated_at?: string; // Read-only
  updated_by?: string; // Read-only

  // Media
  hero_image: File | null;
  exterior_photos: File[];
  interior_photos: File[];
  videos: File[];
}

// ==================== OPTION CONSTANTS ====================

export const DEMOGRAPHICS_OPTIONS = [
  'All',
  'Single_men',
  'Single_women',
  'TAY/Teen',
  'Seniors',
  'Families',
  'Single Moms',
  'Single Dads',
  'LGBTQ+',
  'Other',
] as const;

export const SPECIAL_SITUATION_OPTIONS = [
  'None',
  'Domestic Violence (DV/IPV)',
  'HIV/AIDS',
  'Human Trafficking',
  'Persons Exiting Justice Systems',
  'Veterans',
  'Harm Reduction',
] as const;

export const SHELTER_TYPES_OPTIONS = [
  'Building',
  'Church',
  'Hotel/Motel',
  'Safe Parking',
  'Single Family House',
  'Tiny Homes',
  'Other',
] as const;

export const ROOM_STYLES_OPTIONS = [
  'Congregate (Open)',
  'Cubicle (Low Walls)',
  'Cubicle (High Walls)',
  'High Bunk',
  'Low Bunk',
  'Shared Rooms',
  'Single Room',
  'Motel Room',
] as const;

export const ACCESSIBILITY_OPTIONS = [
  'Medical Equipment',
  'PermittedWheelchair',
  'AccessibleADA Rooms Available',
] as const;

export const STORAGE_OPTIONS = [
  'Amnesty Lockers',
  'Standard Lockers',
  'Shared Storage',
  'No Storage',
] as const;

export const PETS_OPTIONS = [
  'Cats',
  'Dogs (< 25 lbs)',
  'Dogs (> 25 lbs)',
  'Exotics',
  'Service Animals',
  'Pet Area',
  'No Pets Allowed',
] as const;

export const PARKING_OPTIONS = [
  'Bicycle',
  'Motorcycle',
  'Automobile',
  'RV',
  'No Parking',
] as const;

export const BOOLEAN_OPTIONS = [
  { value: null, label: 'Unknown' },
  { value: true, label: 'Yes' },
  { value: false, label: 'No' },
] as const;

export const EXIT_POLICY_OPTIONS = [
  'Exit after 72 hours of being MIA',
  'Exit due to violence to self and others',
  '30 Days Mitigation plan to post someone who exits',
  'Other',
] as const;

export const IMMEDIATE_NEEDS_OPTIONS = [
  'Clothing',
  'Food',
  'Showers',
] as const;

export const GENERAL_SERVICES_OPTIONS = [
  'Case Management',
  'Childcare',
  'Computer Access',
  'Employment Services',
  'Financial Literacy/Assistance',
  'Housing Navigation',
  'Legal Assistance',
  'Mail',
  'Phone',
  'Transportation',
  'Laundry Services',
  'TLS (Time Limited Subsidies)',
] as const;

export const HEALTH_SERVICES_OPTIONS = [
  'Dental',
  'Medical',
  'Mental Health',
  'Substance Use Treatment',
] as const;

export const TRAINING_SERVICES_OPTIONS = [
  'Job Training',
  'Life Skills Training',
  'Tutoring',
] as const;

export const MEAL_SERVICES_OPTIONS = [
  'Breakfast',
  'Lunch',
  'Dinner',
] as const;

export const ENTRY_REQUIREMENTS_OPTIONS = [
  'Medicaid or Medicare',
  'Photo ID',
  'Referral',
  'Reservation',
  'Background Check',
  'Homeless Verification/Observation',
  'Walk-Ups',
  'Vehicle Registration/Insurance',
] as const;

export const REFERRAL_REQUIREMENT_OPTIONS = [
  'Matched Referral',
  'Non-Matched Referral',
  'Service Provider Submission',
  'Self Referral Option',
  'Same Day Intake',
] as const;

export const SPA_OPTIONS = [
  { value: '1', label: '1 – Antelope Valley' },
  { value: '2', label: '2 – San Fernando' },
  { value: '3', label: '3 – San Gabriel' },
  { value: '4', label: '4 – Metro' },
  { value: '5', label: '5 – West' },
  { value: '6', label: '6 – South' },
  { value: '7', label: '7 – East' },
  { value: '8', label: '8 – South Bay/Harbor' },
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

export const SHELTER_PROGRAMS_OPTIONS = [
  'Bridge Home',
  'Crisis Housing',
  'Emergency Shelter',
  'Faith Based',
  'Interim Housing',
  'Permanent Housing',
  'Project Home Key',
  'Rapid Rehousing',
  'Recuperative Care',
  'Roadmap Home',
  'Safe Park LA',
  'Sober Living',
  'Tiny Home Village',
  'Transitional Housing',
  'Winter Shelter',
  'Other',
] as const;

export const FUNDERS_OPTIONS = [
  'City of Los Angeles',
  'DHS',
  'DMH',
  'Federal Funding',
  'HOPWA',
  'LAHSA',
  'Private',
  'Other',
] as const;

export const OVERALL_RATING_OPTIONS = [
  { value: null, label: 'None' },
  { value: 1, label: '1' },
  { value: 2, label: '2' },
  { value: 3, label: '3' },
  { value: 4, label: '4' },
  { value: 5, label: '5' },
] as const;

export const STATUS_OPTIONS = [
  'Draft',
  'Pending',
  'Approval',
  'Inactive',
] as const;

// LA Cities - Add complete list as needed
export const LA_CITIES_OPTIONS = [
  'Los Angeles',
  'Long Beach',
  'Glendale',
  'Pasadena',
  'Burbank',
  'Santa Clarita',
  'Torrance',
  'Pomona',
  'Lancaster',
  'Palmdale',
  // Add more LA cities as needed
] as const;

// Helper type for select options
export type SelectOption<T = string> = {
  value: T;
  label: string;
};
