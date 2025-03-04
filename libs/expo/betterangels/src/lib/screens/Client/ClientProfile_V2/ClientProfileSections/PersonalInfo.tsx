import { format } from 'date-fns';
import { View } from 'react-native';
import {
  enumDisplayLanguage,
  enumDisplayLivingSituation,
  enumDisplayVeteranStatus,
} from '../../../../static';
import { ClientProfileInfo } from '../../../../ui-components';
import { ClientProfileQuery } from '../../__generated__/Client.generated';

type TProps = {
  client: ClientProfileQuery | undefined;
};

export default function PersonalInfo(props: TProps) {
  const { client } = props;

  const {
    dateOfBirth,
    californiaId,
    preferredLanguage,
    veteranStatus,
    livingSituation,
  } = client?.clientProfile || {};

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
      <ClientProfileInfo
        items={content}
        action={{
          onClick: () => alert('clicked'),
          accessibilityLabel: 'edit personal info',
        }}
      />
    </View>
  );
}
