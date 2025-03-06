import { View } from 'react-native';
import {
  ClientProfileCard,
  TClientProfileCardItem,
} from '../../../../ui-components';
import { TClientProfile } from '../types';

type TProps = {
  clientProfile?: TClientProfile;
};

export default function RelevantContacts(props: TProps) {
  const { clientProfile } = props;

  const { firstName, middleName, lastName } = clientProfile?.user || {};
  const nickname = clientProfile?.nickname;

  const content: TClientProfileCardItem[] = [
    {
      header: ['First Name'],
      rows: [[firstName]],
    },
    {
      header: ['Middle Name'],
      rows: [[middleName]],
    },
    {
      header: ['Last Name'],
      rows: [[lastName]],
    },
    {
      header: ['Nickname'],
      rows: [[nickname]],
    },
  ];

  return (
    <View>
      <ClientProfileCard
        items={content}
        // showAll
        action={{
          onClick: () => alert('edit full name'),
        }}
      />
    </View>
  );
}
