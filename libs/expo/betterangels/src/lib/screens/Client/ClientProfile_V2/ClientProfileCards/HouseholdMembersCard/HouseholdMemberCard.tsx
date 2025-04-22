import { formatDateStatic } from '@monorepo/expo/shared/ui-components';
import { View, ViewStyle } from 'react-native';
import { GenderEnum } from '../../../../../apollo';
import {
  clientHouseholdMemberEnumDisplay,
  enumDisplayGender,
} from '../../../../../static';
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

  const { name, dateOfBirth, relationshipToClient, gender } = member;

  const formattedDob = formatDateStatic({
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
      rows: [[enumDisplayGender[gender as GenderEnum]]],
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
        compact
      />
    </View>
  );
}
