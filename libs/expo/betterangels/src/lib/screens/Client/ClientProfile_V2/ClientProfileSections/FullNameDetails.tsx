import { View } from 'react-native';
import { ClientProfileQuery } from '../../__generated__/Client.generated';
import { ClientProfileSection } from '../ClientProfileSection/ClientProfileSection';

type TProps = {
  client: ClientProfileQuery | undefined;
};

export default function FullNameDetails(props: TProps) {
  const { client } = props;

  const { firstName, middleName, lastName } = client?.clientProfile.user || {};
  const nickname = client?.clientProfile.nickname;

  const content = [
    {
      title: 'First Name',
      content: firstName,
    },
    {
      title: 'Middle Name',
      content: middleName,
    },
    {
      title: 'Last Name',
      content: lastName,
    },
    {
      title: 'Nickname',
      content: nickname,
    },
  ];

  return (
    <View>
      <ClientProfileSection
        items={content}
        showAll
        action={{
          onClick: () => alert('clicked'),
          accessibilityLabel: 'edit name information',
        }}
      />
    </View>
  );
}
