import { TextBold } from '@monorepo/expo/shared/ui-components';
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
      header: [Header(agency)],
      rows: [[Row(hmisId)]],
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

function Header(agency: string) {
  if (!agency) {
    return null;
  }

  return (
    <View>
      <TextBold size="sm">{agency}</TextBold>
    </View>
  );
}

function Row(hmisId: string) {
  if (!hmisId) {
    return null;
  }

  return (
    <View>
      <TextBold size="sm">HMIS ID - {hmisId}</TextBold>
    </View>
  );
}
