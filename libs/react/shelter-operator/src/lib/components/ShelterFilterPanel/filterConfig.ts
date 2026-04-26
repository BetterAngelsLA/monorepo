import {
  DemographicChoices,
  enumDisplayDemographics,
  enumDisplayShelterChoices,
  enumDisplaySpecialSituationRestrictionChoices,
  ShelterChoices,
  SpecialSituationRestrictionChoices,
} from '@monorepo/react/shelter';

export type TFilterOption = {
  label: string;
  value: string;
};

export type TFilterGroupConfig = {
  name: string;
  header: string;
  options: TFilterOption[];
  activeClassName: string;
};

const demographicOptions: TFilterOption[] = [
  DemographicChoices.SingleMen,
  DemographicChoices.SingleWomen,
  DemographicChoices.TayTeen,
  DemographicChoices.Seniors,
  DemographicChoices.Families,
  DemographicChoices.SingleMoms,
  DemographicChoices.SingleDads,
  DemographicChoices.LgbtqPlus,
  DemographicChoices.Other,
].map((v) => ({ label: enumDisplayDemographics[v], value: v }));

const ssrOptions: TFilterOption[] = [
  SpecialSituationRestrictionChoices.DomesticViolence,
  SpecialSituationRestrictionChoices.HarmReduction,
  SpecialSituationRestrictionChoices.HivAids,
  SpecialSituationRestrictionChoices.HumanTrafficking,
  SpecialSituationRestrictionChoices.JusticeSystems,
  SpecialSituationRestrictionChoices.Veterans,
].map((v) => ({
  label: enumDisplaySpecialSituationRestrictionChoices[v],
  value: v,
}));

const shelterTypeOptions: TFilterOption[] = [
  ShelterChoices.Building,
  ShelterChoices.Church,
  ShelterChoices.HotelMotel,
  ShelterChoices.SafeParking,
  ShelterChoices.SingleFamilyHouse,
  ShelterChoices.TinyHomes,
  ShelterChoices.Other,
].map((v) => ({ label: enumDisplayShelterChoices[v], value: v }));

export const filterGroups: TFilterGroupConfig[] = [
  {
    name: 'demographics',
    header: 'Demographic',
    options: demographicOptions,
    activeClassName: 'bg-tags-main text-black',
  },
  {
    name: 'specialSituationRestrictions',
    header: 'Special Situation Restriction',
    options: ssrOptions,
    activeClassName: 'bg-tags-yellow text-black',
  },
  {
    name: 'shelterTypes',
    header: 'Shelter Type',
    options: shelterTypeOptions,
    activeClassName: 'bg-tags-purple text-black',
  },
];
