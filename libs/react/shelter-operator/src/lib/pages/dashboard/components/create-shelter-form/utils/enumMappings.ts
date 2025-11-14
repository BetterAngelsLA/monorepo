const SPECIAL_CASES: Record<string, string> = {
  'LGBTQ+': 'lgbtq_plus',
  'Domestic Violence (DV/IPV)': 'domestic_violence',
  'Persons Exiting Justice Systems': 'justice_systems',
  'Medical Equipment': 'medical_equipment_permitted',
  PermittedWheelchair: 'wheelchair_accessible',
  'AccessibleADA Rooms Available': 'ada_rooms',
  'Dogs (< 25 lbs)': 'dogs_under_25_lbs',
  'Dogs (> 25 lbs)': 'dogs_over_25_lbs',
  'Exit after 72 hours of being MIA': 'mia',
  'Exit due to violence to self and others': 'violence',
  '30 Days Mitigation plan to post someone who exits': 'mitigation',
  'TLS (Time Limited Subsidies)': 'tls',
  'Laundry Services': 'laundry',
  'Background Check': 'background',
  'Homeless Verification/Observation': 'homeless_verification',
  'Vehicle Registration/Insurance': 'vehicle_registration',
  'Matched Referral': 'referral_matched',
  'Non-Matched Referral': 'referral_nonmatched',
  'Self Referral Option': 'self_referral',
  'City of Los Angeles': 'city_of_los_angeles',
  'Project Home Key': 'project_home_key',
  'Safe Park LA': 'safe_park_la',
  'Tiny Home Village': 'tiny_home_village',
  Approval: 'approved',
};

const slugify = (value: string) =>
  value
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');

export const normalizeEnumValue = (rawValue: string | null | undefined): string | undefined => {
  if (!rawValue) {
    return undefined;
  }

  const value = rawValue.trim();
  if (!value) {
    return undefined;
  }

  return SPECIAL_CASES[value] ?? slugify(value);
};

export const normalizeEnumValues = (values: readonly string[] | undefined): string[] => {
  if (!values?.length) {
    return [];
  }

  const normalized = values
    .map(normalizeEnumValue)
    .filter((item): item is string => Boolean(item));

  return Array.from(new Set(normalized));
};

export const normalizeCityValues = (values: readonly string[] | undefined): string[] => {
  if (!values?.length) {
    return [];
  }

  return Array.from(new Set(values.map(value => slugify(value))));
};

export const normalizeStatusValue = (value: string | null | undefined) =>
  normalizeEnumValue(value) ?? 'draft';
