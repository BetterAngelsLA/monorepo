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
      header: ['HMIS ID'],
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
