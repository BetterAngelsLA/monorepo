import { HmisClientProfileType } from '../../../apollo';
import { enumGenderHmis, enumRaceHmis } from '../../../static';
import {
  ClientProfileCard,
  ClientProfileCardContainer,
  TClientProfileCardItem,
} from '../../../ui-components';

type TProps = {
  client?: HmisClientProfileType;
};

/**
 * hmisProd variant of `DemographicInfoCardHmis` — v1 only renders fields that
 * exist in Clarity (gender, race/ethnicity, identity text). The BA-only rows
 * (pronouns, height, eye/hair color, …) are omitted until they have a
 * direct-REST source.
 */
export function DemographicInfoCardHmisProd(props: TProps) {
  const { client } = props;

  console.log();
  console.log('| -------------  DemographicInfoCardHmisProd  ------------- |');
  console.log(JSON.stringify(client, null, 2));
  console.log();

  const {
    gender,
    raceEthnicity,
    additionalRaceEthnicityDetail,
    genderIdentityText,
  } = client || {};

  const genderValues = (gender || [])
    .filter((key) => !!key)
    .map((key) => enumGenderHmis[key])
    .join(', ');

  const raceEthnicityValues = (raceEthnicity || [])
    .filter((key) => !!key)
    .map((key) => enumRaceHmis[key])
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
      <ClientProfileCard items={content} />
    </ClientProfileCardContainer>
  );
}
