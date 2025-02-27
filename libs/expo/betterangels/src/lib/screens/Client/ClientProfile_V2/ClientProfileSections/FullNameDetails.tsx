import { View } from 'react-native';
import { ClientProfileInfo } from '../../../../ui-components';
import { ClientProfileQuery } from '../../__generated__/Client.generated';

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
      <ClientProfileInfo
        items={content}
        action={{
          onClick: () => alert('clicked'),
          accessibilityLabel: 'edit name information',
        }}
      />
    </View>
  );
}
