import { format } from 'date-fns';
import { View } from 'react-native';
import {
  enumDisplayLanguage,
  enumDisplayLivingSituation,
  enumDisplayVeteranStatus,
} from '../../../../static';
import {
  ClientProfileCard,
  TClientProfileCardItem,
} from '../../../../ui-components';
import { TClientProfile } from '../types';

type TProps = {
  clientProfile?: TClientProfile;
};

export default function PersonalInfo(props: TProps) {
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
    <View>
      <ClientProfileCard
        items={content}
        // showAll
        action={{
          onClick: () => alert('edit personal info'),
        }}
      />
    </View>
  );
}
