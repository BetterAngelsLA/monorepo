import { View } from 'react-native';
import { ClientProfileQuery } from '../__generated__/Client.generated';
import { InteractionLocationsMap } from './InteractionLocationsMap';

type TProps = {
  client: ClientProfileQuery | undefined;
};

export function InteractionLocations(props: TProps) {
  const { client } = props;

  if (!client?.clientProfile.id) {
    throw new Error('Something went wrong. Please try again.');
  }

  return (
    <View style={{ flex: 1, borderWidth: 8, borderColor: 'black' }}>
      <InteractionLocationsMap clientProfileId={client.clientProfile.id} />
    </View>
  );
}
