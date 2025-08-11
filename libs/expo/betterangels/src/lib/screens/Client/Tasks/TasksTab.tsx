import { TextRegular } from '@monorepo/expo/shared/ui-components';
import { View } from 'react-native';
import { ClientProfileQuery } from '../__generated__/Client.generated';

type TProps = {
  client: ClientProfileQuery | undefined;
};

export function TasksTab(props: TProps) {
  const { client } = props;

  if (!client?.clientProfile.id) {
    throw new Error('Something went wrong. Please try again.');
  }

  return (
    <View style={{ flex: 1 }}>
      <TextRegular>Tasks Tab</TextRegular>
    </View>
  );
}
