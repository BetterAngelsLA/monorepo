import { hasWysiwygContent } from './hasWysiwygContent';

export type ShelterData = {
  website?: string | null;
  phone?: unknown;
  email?: string | null;
  location?: { place?: string | null } | null;
  services?: unknown[] | null;
  otherServices?: string | null;
  description?: string | null;
  entryRequirements?: unknown[];
  referralRequirement?: unknown[];
  entryInfo?: string | null;
  bedFees?: string | null;
  programFees?: string | null;
  specialSituationRestrictions?: unknown[];
  shelterTypes?: unknown[];
  shelterTypesOther?: string | null;
  roomStyles?: unknown[];
  accessibility?: unknown[];
  storage?: unknown[];
  pets?: unknown[];
  parking?: unknown[];
  maxStay?: number | null;
  curfew?: unknown;
  exitPolicy?: unknown[];
  visitorsAllowed?: boolean | null;
  emergencySurge?: boolean | null;
  onSiteSecurity?: boolean | null;
  otherRules?: string | null;
  cities?: unknown[];
  spa?: unknown[];
  cityCouncilDistrict?: number | null;
  supervisorialDistrict?: number | null;
  shelterPrograms?: unknown[];
  funders?: unknown[];
  interiorPhotos?: unknown[];
  exteriorPhotos?: unknown[];
  mediaLinks?: unknown[];
};

export type ShelterVisibility = {
  generalInfo: boolean;
  services: boolean;
  description: boolean;
  entryRequirements: boolean;
  specialRestrictions: boolean;
  shelterTypes: boolean;
  roomStyles: boolean;
  shelterDetail: boolean;
  restrictions: boolean;
  ecosystemInfo: boolean;
  media: boolean;
};

export type RestrictionsFieldVisibility = {
  maxStay: boolean;
  exitPolicy: boolean;
  visitorsAllowed: boolean;
  emergencySurge: boolean;
  onSiteSecurity: boolean;
  otherRules: boolean;
};

export function getShelterVisibility(shelter: ShelterData): ShelterVisibility {
  return {
    generalInfo:
      !!shelter.website ||
      !!shelter.phone ||
      !!shelter.email ||
      !!shelter.location?.place,
    services:
      !!shelter.services?.length || hasWysiwygContent(shelter.otherServices),
    description: hasWysiwygContent(shelter.description),
    entryRequirements:
      !!shelter.entryRequirements?.length ||
      !!shelter.referralRequirement?.length ||
      hasWysiwygContent(shelter.entryInfo) ||
      hasWysiwygContent(shelter.bedFees) ||
      hasWysiwygContent(shelter.programFees),
    specialRestrictions: !!shelter.specialSituationRestrictions?.length,
    shelterTypes: !!shelter.shelterTypes?.length || !!shelter.shelterTypesOther,
    roomStyles: !!shelter.roomStyles?.length,
    shelterDetail:
      !!shelter.accessibility?.length ||
      !!shelter.storage?.length ||
      !!shelter.pets?.length ||
      !!shelter.parking?.length,
    restrictions:
      !!shelter.maxStay ||
      !!shelter.curfew ||
      !!shelter.exitPolicy?.length ||
      shelter.visitorsAllowed != null ||
      shelter.emergencySurge != null ||
      shelter.onSiteSecurity != null ||
      hasWysiwygContent(shelter.otherRules),
    ecosystemInfo:
      !!shelter.cities?.length ||
      !!shelter.spa?.length ||
      !!shelter.cityCouncilDistrict ||
      !!shelter.supervisorialDistrict ||
      !!shelter.shelterPrograms?.length ||
      !!shelter.funders?.length,
    media:
      !!shelter.interiorPhotos?.length ||
      !!shelter.exteriorPhotos?.length ||
      !!shelter.mediaLinks?.length,
  };
}

export function getRestrictionsFieldVisibility(
  shelter: ShelterData
): RestrictionsFieldVisibility {
  return {
    maxStay: !!shelter.maxStay,
    exitPolicy: !!shelter.exitPolicy?.length,
    visitorsAllowed: shelter.visitorsAllowed != null,
    emergencySurge: shelter.emergencySurge != null,
    onSiteSecurity: shelter.onSiteSecurity != null,
    otherRules: hasWysiwygContent(shelter.otherRules),
  };
}
