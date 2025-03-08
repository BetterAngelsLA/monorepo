import { TextBold } from '@monorepo/expo/shared/ui-components';
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
  style?: ViewStyle;
};

export function RelevantContact(props: TProps) {
  const { contact, style } = props;

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
      {!!relationshipToClient && (
        <TextBold size="md" mb="sm">
          {clientRelevantContactEnumDisplay[relationshipToClient]}
        </TextBold>
      )}

      <ClientProfileCard
        items={content}
        action={{
          onClick: () => alert('edit relevant contacts'),
        }}
      />
    </View>
  );
}
