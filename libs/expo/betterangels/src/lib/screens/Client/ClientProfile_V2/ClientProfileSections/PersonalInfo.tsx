import { format } from 'date-fns';
import { View } from 'react-native';
import { ClientProfileQuery } from '../../__generated__/Client.generated';
import { ClientProfileSection } from '../ClientProfileSection/ClientProfileSection';

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
      content: preferredLanguage,
    },
    {
      title: 'Veteran Status',
      content: veteranStatus,
    },
    {
      title: 'Living Situation',
      content: livingSituation,
    },
  ];

  return (
    <View>
      <ClientProfileSection
        items={content}
        action={{
          onClick: () => alert('clicked'),
          accessibilityLabel: 'edit name information',
        }}
      />
    </View>
  );
}
