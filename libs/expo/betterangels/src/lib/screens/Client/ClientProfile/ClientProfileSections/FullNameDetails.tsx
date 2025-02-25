import { View } from 'react-native';
import { ClientProfileQuery } from '../../__generated__/Client.generated';
import { ClientProfileSection } from '../ClientProfileSection/ClientProfileSection';

type TFullNameDetails = {
  client: ClientProfileQuery | undefined;
};

export default function FullNameDetails(props: TFullNameDetails) {
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
      <ClientProfileSection items={content} />
    </View>
  );
}
