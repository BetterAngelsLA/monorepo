import { View, ViewStyle } from 'react-native';
import { enumDisplayHmisAgency } from '../../../../../static';
import {
  ClientProfileCard,
  TClientProfileCardItem,
} from '../../../../../ui-components';
import { TClientProfileHmisProfile } from '../../types';

type TProps = {
  hmisProfile?: TClientProfileHmisProfile;
  style?: ViewStyle;
};

export function HmisProfileCard(props: TProps) {
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
        title={enumDisplayHmisAgency[agency]}
        items={content}
        compact
      />
    </View>
  );
}
