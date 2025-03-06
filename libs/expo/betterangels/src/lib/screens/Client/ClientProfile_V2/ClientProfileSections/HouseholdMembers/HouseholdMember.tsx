import { TextBold } from '@monorepo/expo/shared/ui-components';
import { clientHouseholdMemberEnumDisplay } from 'libs/expo/betterangels/src/lib/static';
import { View, ViewStyle } from 'react-native';
import {
  ClientProfileCard,
  TClientProfileCardItem,
} from '../../../../../ui-components';
import { ClientProfileQuery } from '../../../__generated__/Client.generated';

type THouseholdMemeber = NonNullable<
  NonNullable<ClientProfileQuery['clientProfile']>['householdMembers']
>[number];

type TProps = {
  member?: THouseholdMemeber;
  style?: ViewStyle;
};

export function HouseholdMember(props: TProps) {
  const { member, style } = props;

  if (!member) {
    return null;
  }

  const { name, gender, dateOfBirth, relationshipToClient } = member;

  const content: TClientProfileCardItem[] = [
    {
      header: ['Name'],
      rows: [[name]],
    },
    {
      header: ['Gender'],
      rows: [[gender]],
    },
    {
      header: ['Date of Birth'],
      rows: [[dateOfBirth]],
    },
  ];

  return (
    <View style={style}>
      {!!relationshipToClient && (
        <TextBold size="md" mb="sm">
          {clientHouseholdMemberEnumDisplay[relationshipToClient]}
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
