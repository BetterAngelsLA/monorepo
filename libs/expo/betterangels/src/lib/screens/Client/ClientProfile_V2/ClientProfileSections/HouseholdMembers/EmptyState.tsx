import { TextBold } from '@monorepo/expo/shared/ui-components';
import { View, ViewStyle } from 'react-native';
import {
  ClientProfileCard,
  TClientProfileCardItem,
} from '../../../../../ui-components';
import { ClientProfileQuery } from '../../../__generated__/Client.generated';

type TContact = NonNullable<
  NonNullable<ClientProfileQuery['clientProfile']>['contacts']
>[number];

type TProps = {
  style?: ViewStyle;
};

export function EmptyState(props: TProps) {
  const { style } = props;

  const content: TClientProfileCardItem[] = [
    {
      header: [Header()],
      rows: [[]],
    },
  ];

  return (
    <View style={style}>
      <ClientProfileCard
        items={content}
        action={{
          onClick: () => alert('add relevant contacts'),
        }}
      />
    </View>
  );
}

function Header() {
  return (
    <View>
      <TextBold size="sm">Household Member</TextBold>
    </View>
  );
}
