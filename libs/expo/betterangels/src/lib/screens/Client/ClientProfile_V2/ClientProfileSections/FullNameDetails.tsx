import { View } from 'react-native';
import { ClientProfileInfo } from '../../../../ui-components';
import { TClientProfile } from '../types';

type TProps = {
  clientProfile?: TClientProfile;
};

export default function FullNameDetails(props: TProps) {
  const { clientProfile } = props;

  const { firstName, middleName, lastName } = clientProfile?.user || {};
  const nickname = clientProfile?.nickname;

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
