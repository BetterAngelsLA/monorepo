import { HmisClientProfileType } from '../../../../../apollo';
import { enumHmisGender, enumHmisRace } from '../../../../../static';
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
  } = client || {};

  const genderValues = (gender || [])
    .filter((key) => !!key)
    .map((key) => enumHmisGender[key])
    .join(', ');

  const raceEthnicityValues = (raceEthnicity || [])
    .filter((key) => !!key)
    .map((key) => enumHmisRace[key])
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
  ];

  return (
    <ClientProfileCardContainer>
      <ClientProfileCard items={content} showAll={true} />
    </ClientProfileCardContainer>
  );
}
