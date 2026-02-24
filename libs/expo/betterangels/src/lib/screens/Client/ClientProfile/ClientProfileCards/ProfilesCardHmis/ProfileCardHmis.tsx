import { View, ViewStyle } from 'react-native';
import { enumDisplayAgencyHmis } from '../../../../../static';
import {
  ClientProfileCard,
  TClientProfileCardItem,
} from '../../../../../ui-components';
import { TClientProfileHmis } from '../../types';

type TProps = {
  hmisProfile?: TClientProfileHmis;
  style?: ViewStyle;
};

export function ProfileCardHmis(props: TProps) {
  const { hmisProfile, style } = props;

  if (!hmisProfile) {
    return null;
  }

  const { hmisId, agency } = hmisProfile;

  const content: TClientProfileCardItem[] = [
    {
      header: ['HMIS ID'],
      rows: [[hmisId]],
    },
  ];

  return (
    <View style={style}>
      <ClientProfileCard
        title={enumDisplayAgencyHmis[agency]}
        items={content}
        compact
      />
    </View>
  );
}
