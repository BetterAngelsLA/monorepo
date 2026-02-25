import { getFormattedLength } from '@monorepo/expo/shared/ui-components';
import { HmisClientProfileType } from '../../../../../apollo';
import {
  enumDisplayAdaAccommodationEnum,
  enumDisplayEyeColor,
  enumDisplayHairColor,
  enumDisplayMaritalStatus,
  enumDisplayPronoun,
  enumHmisGender,
  enumHmisRace,
} from '../../../../../static';
import {
  ClientProfileCard,
  ClientProfileCardContainer,
  TClientProfileCardItem,
} from '../../../../../ui-components';

type TProps = {
  client?: HmisClientProfileType;
};

export function DemographicInfoCardHmis(props: TProps) {
  const { client } = props;
  const {
    gender,
    raceEthnicity,
    additionalRaceEthnicityDetail,
    genderIdentityText,
    pronouns,
    placeOfBirth,
    heightInInches,
    eyeColor,
    hairColor,
    maritalStatus,
    physicalDescription,
    adaAccommodation,
  } = client || {};

  const genderValues = (gender || [])
    .filter((key) => !!key)
    .map((key) => enumHmisGender[key])
    .join(', ');

  const raceEthnicityValues = (raceEthnicity || [])
    .filter((key) => !!key)
    .map((key) => enumHmisRace[key])
    .join(', ');

  const formattedHeight = getFormattedLength({
    length: heightInInches,
    inputUnit: 'inches',
    outputUnit: 'inches',
    format: 'feet-inches-symbol',
  });

  const adaAccommodationDisplay = (adaAccommodation || [])
    .filter((key) => !!key)
    .map((key) => enumDisplayAdaAccommodationEnum[key])
    .join(', ');

  const content: TClientProfileCardItem[] = [
    {
      header: ['Gender'],
      rows: [[genderValues]],
    },
    {
      header: ['Race and Ethnicity'],
      rows: [[raceEthnicityValues]],
    },
    {
      header: ['Additional Race and Ethnicity'],
      rows: [[additionalRaceEthnicityDetail]],
    },
    {
      header: ['Different Identity Text'],
      rows: [[genderIdentityText]],
    },
    {
      header: ['Pronouns'],
      rows: [[pronouns && enumDisplayPronoun[pronouns]]],
    },
    {
      header: ['Place of Birth'],
      rows: [[placeOfBirth]],
    },
    {
      header: ['Height'],
      rows: [[formattedHeight]],
    },
    {
      header: ['Eye Color'],
      rows: [[eyeColor && enumDisplayEyeColor[eyeColor]]],
    },
    {
      header: ['Hair Color'],
      rows: [[hairColor && enumDisplayHairColor[hairColor]]],
    },
    {
      header: ['Marital Status'],
      rows: [[maritalStatus && enumDisplayMaritalStatus[maritalStatus]]],
    },
    {
      header: ['Physical Description'],
      rows: [[physicalDescription]],
    },
    {
      header: ['ADA Accommodation'],
      rows: [[adaAccommodationDisplay]],
    },
  ];

  return (
    <ClientProfileCardContainer>
      <ClientProfileCard items={content} />
    </ClientProfileCardContainer>
  );
}
