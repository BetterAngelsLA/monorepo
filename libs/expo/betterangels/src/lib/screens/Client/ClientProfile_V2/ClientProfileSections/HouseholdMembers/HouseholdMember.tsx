import { TextBold, parseDate } from '@monorepo/expo/shared/ui-components';
import { clientHouseholdMemberEnumDisplay } from 'libs/expo/betterangels/src/lib/static';
import { View, ViewStyle } from 'react-native';
import {
  ClientProfileCard,
  TClientProfileCardItem,
} from '../../../../../ui-components';
import { TClientProfileHouseholdMemeber } from '../../types';

type TProps = {
  member?: TClientProfileHouseholdMemeber;
  style?: ViewStyle;
};

export function HouseholdMember(props: TProps) {
  const { member, style } = props;

  if (!member) {
    return null;
  }

  const { name, displayGender, dateOfBirth, relationshipToClient } = member;

  const formattedDoB = parseDate({
    date: dateOfBirth,
    inputFormat: 'yyyy-MM-dd',
  });

  const content: TClientProfileCardItem[] = [
    {
      header: ['Name'],
      rows: [[name]],
    },
    {
      header: ['Gender'],
      rows: [[displayGender]],
    },
    {
      header: ['Date of Birth'],
      rows: [[formattedDoB]],
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
