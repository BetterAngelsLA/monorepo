import { CityType, SpaType } from '../../../apollo';
import { hasWysiwygContent } from './hasWysiwygContent';

type NameItem = { name?: string | null };

export type ShelterData = {
  website?: string | null;
  phone?: string | null;
  email?: string | null;
  location?: { place?: string | null } | null;
  services?: { id: string }[] | null;
  otherServices?: string | null;
  description?: string | null;
  entryRequirements?: NameItem[];
  referralRequirement?: NameItem[];
  entryInfo?: string | null;
  bedFees?: string | null;
  programFees?: string | null;
  specialSituationRestrictions?: NameItem[];
  shelterTypes?: NameItem[];
  shelterTypesOther?: string | null;
  roomStyles?: NameItem[];
  accessibility?: NameItem[];
  storage?: NameItem[];
  pets?: NameItem[];
  parking?: NameItem[];
  maxStay?: number | null;
  curfew?: string | null;
  exitPolicy?: NameItem[];
  visitorsAllowed?: boolean | null;
  emergencySurge?: boolean | null;
  onSiteSecurity?: boolean | null;
  otherRules?: string | null;
  city?: CityType | null;
  spa?: SpaType | null;
  cityCouncilDistrict?: number | null;
  supervisorialDistrict?: number | null;
  shelterPrograms?: NameItem[];
  funders?: NameItem[];
  photos?: { id: string; file: { url: string } }[];
  mediaLinks?: { id: string }[];
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
  curfew: boolean;
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
      !!shelter.city ||
      !!shelter.spa ||
      !!shelter.cityCouncilDistrict ||
      !!shelter.supervisorialDistrict ||
      !!shelter.shelterPrograms?.length ||
      !!shelter.funders?.length,
    media: !!shelter.photos?.length || !!shelter.mediaLinks?.length,
  };
}

export function getRestrictionsFieldVisibility(
  shelter: ShelterData
): RestrictionsFieldVisibility {
  return {
    maxStay: !!shelter.maxStay,
    curfew: true,
    exitPolicy: !!shelter.exitPolicy?.length,
    visitorsAllowed: shelter.visitorsAllowed != null,
    emergencySurge: shelter.emergencySurge != null,
    onSiteSecurity: shelter.onSiteSecurity != null,
    otherRules: hasWysiwygContent(shelter.otherRules),
  };
}
