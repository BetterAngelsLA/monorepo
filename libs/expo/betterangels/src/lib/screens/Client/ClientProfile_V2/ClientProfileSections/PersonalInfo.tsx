import { format } from 'date-fns';
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

type TProps = {
  clientProfile?: TClientProfile;
};

export function PersonalInfo(props: TProps) {
  const { clientProfile } = props;

  const {
    dateOfBirth,
    californiaId,
    preferredLanguage,
    veteranStatus,
    livingSituation,
  } = clientProfile || {};

  const formattedDob = dateOfBirth
    ? format(new Date(dateOfBirth), 'MM/dd/yyyy')
    : null;

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
  ];

  return (
    <ClientProfileCardContainer>
      <ClientProfileCard
        items={content}
        // showAll
        action={{
          onClick: () => alert('edit personal info'),
        }}
      />
    </ClientProfileCardContainer>
  );
}
