import { View, ViewStyle } from 'react-native';
import {
  ClientProfileCard,
  TClientProfileCardItem,
} from '../../../../../ui-components';
import { TClientProfileHmisProfile } from '../../types';

type TProps = {
  hmisProfile?: TClientProfileHmisProfile;
  style?: ViewStyle;
};

export function HmisProfile(props: TProps) {
  const { hmisProfile, style } = props;

  if (!hmisProfile) {
    return null;
  }

  const { hmisId, agency } = hmisProfile;

  const content: TClientProfileCardItem[] = [
    {
      header: [agency],
      rows: [[hmisId]],
    },
  ];

  return (
    <View style={style}>
      <ClientProfileCard
        items={content}
        action={{
          onClick: () => alert('edit hmis profile'),
        }}
      />
    </View>
  );
}
