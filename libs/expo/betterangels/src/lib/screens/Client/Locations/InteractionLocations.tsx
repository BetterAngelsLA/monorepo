import { View } from 'react-native';
import { ClientProfileQuery } from '../__generated__/Client.generated';
import { InteractionLocationsModal } from './InteractionLocationsModal';
import { InteractionsMap } from './map/InteractionsMap';

type TProps = {
  client: ClientProfileQuery | undefined;
};

export function InteractionLocations(props: TProps) {
  const { client } = props;

  if (!client?.clientProfile.id) {
    throw new Error('Something went wrong. Please try again. ');
  }

  return (
    <View style={{ flex: 1 }}>
      <InteractionsMap clientProfileId={client.clientProfile.id} />
      <InteractionLocationsModal />
    </View>
  );
}
