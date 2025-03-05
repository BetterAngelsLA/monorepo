import { View } from 'react-native';
import { ClientProfileCard } from '../../../../ui-components';
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
      title: ['First Name', 'HELLO'],
      // content: firstName,
      // content: null,
      content: [['firstA', 'firstB']],
    },
    {
      title: 'Middle Name',
      // content: middleName,
      content: null,
    },
    {
      title: 'Last Name',
      // content: lastName,
      content: null,
    },
    // {
    //   title: 'Nickname',
    //   content: nickname,
    // },
  ];

  return (
    <View>
      <ClientProfileCard
        items={content}
        action={{
          onClick: () => alert('edit full name'),
        }}
      />
    </View>
  );
}
