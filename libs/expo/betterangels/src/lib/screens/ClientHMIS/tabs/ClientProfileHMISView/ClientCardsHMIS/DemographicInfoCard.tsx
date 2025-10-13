import { enumHmisGender } from 'libs/expo/betterangels/src/lib/static';
import { HmisClientType } from '../../../../../apollo';
import {
  ClientProfileCard,
  ClientProfileCardContainer,
  TClientProfileCardItem,
} from '../../../../../ui-components';

type TProps = {
  client?: HmisClientType;
};

export function DemographicInfoCardHmis(props: TProps) {
  const { client } = props;

  const { data } = client || {};
  const { gender, additionalRaceEthnicity, differentIdentityText } = data || {};

  const genderValue = (gender || [])
    .filter((key) => !!key)
    .map((key) => enumHmisGender[key])
    .join(', ');

  const content: TClientProfileCardItem[] = [
    {
      header: ['Gender'],
      rows: [[genderValue]],
    },
    {
      header: ['Additional Race Ethnicity'],
      rows: [[additionalRaceEthnicity]],
    },
    {
      header: ['Different Identity Text'],
      rows: [[differentIdentityText]],
    },
  ];

  return (
    <ClientProfileCardContainer>
      <ClientProfileCard items={content} showAll={true} />
    </ClientProfileCardContainer>
  );
}
