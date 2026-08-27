import {
  enumDisplayLanguage,
  enumDisplayLivingSituation,
  enumDisplayVeteranStatus,
} from '../../../../static';
import {
  ClientProfileCard,
  ClientProfileCardContainer,
  TClientProfileCardItem,
} from '../../../../ui-components';
import { TClientProfile } from '../types';
import { formatScalarDate } from '@monorepo/shared/scalars';

type TProps = {
  clientProfile?: TClientProfile;
};

export function PersonalInfoCard(props: TProps) {
  const { clientProfile } = props;

  const {
    dateOfBirth,
    californiaId,
    preferredLanguage,
    veteranStatus,
    livingSituation,
    unhousedStartDate,
  } = clientProfile || {};

  const formattedDob = formatScalarDate(dateOfBirth, 'MM/dd/yyyy');
  const formattedUnhousedStartDate = formatScalarDate(
    unhousedStartDate,
    'MM/dd/yyyy',
  );

  const content: TClientProfileCardItem[] = [
    {
      header: ['Date of Birth'],
      rows: [[formattedDob]],
    },
    {
      header: ['CA ID #'],
      rows: [[californiaId]],
    },
    {
      header: ['Preferred Language'],
      rows: [[preferredLanguage && enumDisplayLanguage[preferredLanguage]]],
    },
    {
      header: ['Veteran Status'],
      rows: [[veteranStatus && enumDisplayVeteranStatus[veteranStatus]]],
    },
    {
      header: ['Living Situation'],
      rows: [[livingSituation && enumDisplayLivingSituation[livingSituation]]],
    },
    {
      header: ['Approximate Date Homelessness Started'],
      rows: [[formattedUnhousedStartDate]],
    },
  ];

  return (
    <ClientProfileCardContainer>
      <ClientProfileCard items={content} />
    </ClientProfileCardContainer>
  );
}
