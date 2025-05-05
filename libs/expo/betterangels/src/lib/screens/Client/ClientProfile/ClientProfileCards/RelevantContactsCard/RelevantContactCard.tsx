import { formatPhoneNumber } from '@monorepo/expo/shared/utils';
import { View, ViewStyle } from 'react-native';
import { clientRelevantContactEnumDisplay } from '../../../../../static';
import {
  ClientProfileCard,
  TClientProfileCardItem,
} from '../../../../../ui-components';
import { TClientProfileContact } from '../../types';

type TProps = {
  contact?: TClientProfileContact;
  showAllFields?: boolean;
  style?: ViewStyle;
};

export function RelevantContactCard(props: TProps) {
  const { contact, showAllFields, style } = props;

  if (!contact) {
    return null;
  }

  const { name, email, phoneNumber, mailingAddress, relationshipToClient } =
    contact;

  const content: TClientProfileCardItem[] = [
    {
      header: ['Name'],
      rows: [[name]],
    },
    {
      header: ['Email'],
      rows: [[email]],
    },
    {
      header: ['Phone number'],
      rows: [[phoneNumber && formatPhoneNumber(phoneNumber)]],
    },
    {
      header: ['Mailing Address'],
      rows: [[mailingAddress]],
    },
  ];

  return (
    <View style={style}>
      <ClientProfileCard
        title={
          relationshipToClient &&
          clientRelevantContactEnumDisplay[relationshipToClient]
        }
        items={content}
        showAll={!!showAllFields}
        compact
      />
    </View>
  );
}
