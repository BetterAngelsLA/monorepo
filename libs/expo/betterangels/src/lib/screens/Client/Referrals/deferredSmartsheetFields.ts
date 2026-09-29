/**
 * Reference-only (not collected, not wired to anything).
 *
 * The rest of the Phase-1 Smartsheet referral form — every field that has NO app
 * home today (Smartsheet ✓ / ClientProfile ✗ in the field matrix). Rendered
 * collapsed in the intake form purely to give the team/testers perspective on the
 * deferred scope (GAP-02 / GAP-13): the required section above is a small slice of
 * this. Exact-name duplicates already collected above (Storage, Pet) are omitted.
 *
 * Source of truth: betterangels-notes/requirements/field-environment-matrix.md
 * Delete this file (and its card in ReferralIntakeForm) once the field set is
 * ratified in requirements V.2.
 */

export const DEFERRED_SMARTSHEET_FIELDS: {
  section: string;
  fields: string[];
}[] = [
  {
    section: 'Starting Questions',
    fields: ['Translation Services', 'Referring Agency'],
  },
  {
    section: 'Questions for Referring Agency',
    fields: [
      'Referral Date',
      'Referring Agency Name',
      'Referring Staff Name',
      'Referring Staff Title',
      'Referring Staff Phone Number',
      'Referring Staff Email',
      'Alternate Contact',
      'Referring Entity Type',
    ],
  },
  {
    section: 'Biographical Information',
    fields: [
      'SSN',
      'Maiden Name',
      'IBHIS #',
      'CHAMP ID #',
      'CES Acuity Score',
      'CES Score Type',
      'Matched to Housing Resource',
      'Gender Bed Preference',
      'Sexual Orientation',
      'Veteran Healthcare',
      'Veteran Identification',
      'Identification',
    ],
  },
  {
    section: 'Homelessness / Shelter Background',
    fields: [
      'SPA',
      'Chronic Homelessness',
      'Length of Homelessness',
      'Homelessness Start Date',
      'Chronic Homelessness Verification',
      'ODR Funded Program',
      'ODR Program Name',
      'Law Enforcement Custody due to lack of housing',
      'Custody Discharge Date',
      'Exit Institution in the past 90 days',
      'Conserved or Conservatorship hearing pending',
      'Conservatorship Type',
      'Other Referring Agency Considerations',
      'Cause of Homelessness',
      'Income Source',
      'How did participant find out about shelter/program',
      'Past shelter or program services',
      'Past services information',
    ],
  },
  {
    section: 'Health & Presenting Needs',
    fields: [
      'Presenting Issues',
      'In School',
      'Current Legal Problems',
      'Pregnant',
      'Week Pregnant',
    ],
  },
  {
    section: 'Domestic Violence',
    fields: [
      'Domestic Violence',
      'Last DV Experience',
      'DV Treatment or Counseling',
      'Past DCFS case / AB 12',
      'Open DCFS case / AB 12',
      'DCFS Requirements for the family to complete',
    ],
  },
  {
    section: 'Household Information',
    fields: [
      'Family Housing',
      'Pregnant household members',
      'Relationship to pregnant household member',
      'Additional household information',
    ],
  },
  {
    section: 'TB Screening',
    fields: [
      'Cough',
      'Weight loss',
      'Night sweats',
      'Coughed up blood',
      'Unusual tiredness',
      'Persistent fever',
      'TB Test Performed',
      'TB Test Date Completed',
      'TB Test Results',
      'Chest X-Ray Performed',
      'Chest X-Ray Date Completed',
      'Chest X-Ray Results',
    ],
  },
  {
    section: 'Additional Participant / Household Info',
    fields: [
      'Household accommodations',
      'Specify Household accommodations',
      'Animals',
      'Service Animal',
      'Emotional Support Animal',
    ],
  },
  {
    section: 'Current Sleeping / Living Arrangement',
    fields: [
      'Place not meant for human habitation',
      'Duration sleeping in their vehicle',
      'Shelter / Interim Housing Name',
      'Time resided in institution',
      'Date of eviction / unit relinquished',
      'Other sleeping arrangements',
    ],
  },
  {
    section: 'Interim Housing Placement Location',
    fields: [
      'Congregate living',
      'Skid Row',
      'Top Bunk',
      'Preferred SPAs',
      'Preferred Cities',
      'Preferred Cities Names',
      'Preferred housing provider',
      'Preferred housing provider name',
      'Alternate housing provider',
      'SPAs participant cannot live in',
      'Cities participant cannot live in',
    ],
  },
  {
    section: 'Vehicle Information',
    fields: [
      'Vehicle',
      'Vehicle registration and/or insurance',
      'Current parking location',
      'Compliance Documents',
    ],
  },
  {
    section: 'Additional Required Document Acknowledgement',
    fields: ['DMH Referrals', 'DHS Referrals', 'Notes'],
  },
];

export const DEFERRED_FIELD_COUNT = DEFERRED_SMARTSHEET_FIELDS.reduce(
  (n, g) => n + g.fields.length,
  0,
);
