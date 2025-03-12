import { parseDate } from '@monorepo/expo/shared/ui-components';
import { View, ViewStyle } from 'react-native';
import { clientHouseholdMemberEnumDisplay } from '../../../../../static';
import {
  ClientProfileCard,
  TClientProfileCardItem,
} from '../../../../../ui-components';
import { TClientProfileHouseholdMemeber } from '../../types';

type TProps = {
  member?: TClientProfileHouseholdMemeber;
  style?: ViewStyle;
};

export function HouseholdMemberCard(props: TProps) {
  const { member, style } = props;

  if (!member) {
    return null;
  }

  const { name, displayGender, dateOfBirth, relationshipToClient } = member;

  const formattedDob = parseDate({
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
      rows: [[formattedDob]],
    },
  ];

  return (
    <View style={style}>
      <ClientProfileCard
        title={
          relationshipToClient &&
          clientHouseholdMemberEnumDisplay[relationshipToClient]
        }
        items={content}
      />
    </View>
  );
}
