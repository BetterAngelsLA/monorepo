import { format } from 'date-fns';
import { View } from 'react-native';
import {
  enumDisplayLanguage,
  enumDisplayLivingSituation,
  enumDisplayVeteranStatus,
} from '../../../../static';
import { ClientProfileCard } from '../../../../ui-components';
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

  const content = [
    {
      title: 'Date of Birth',
      content: formattedDob,
    },
    {
      title: 'CA ID #',
      content: californiaId,
    },
    {
      title: 'Preferred Language',
      content: preferredLanguage && enumDisplayLanguage[preferredLanguage],
    },
    {
      title: 'Veteran Status',
      content: veteranStatus && enumDisplayVeteranStatus[veteranStatus],
    },
    {
      title: 'Living Situation',
      content: livingSituation && enumDisplayLivingSituation[livingSituation],
    },
  ];

  return (
    <View>
      <ClientProfileCard
        items={content}
        action={{
          onClick: () => alert('edit personal info'),
        }}
      />
    </View>
  );
}
