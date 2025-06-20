import { useState } from 'react';
import { NotesQuery } from '../../../apollo';

import { View } from 'react-native';
import { ClientProfileQuery } from '../__generated__/Client.generated';
import { InteractionLocationsModal } from './InteractionLocationsModal';
import { InteractionsMap } from './map/InteractionsMap';

type TProps = {
  client: ClientProfileQuery | undefined;
};

export function InteractionLocations(props: TProps) {
  const { client } = props;
  const [selectedLocation, setSelectedLocation] = useState<
    NotesQuery['notes']['results'][number] | null
  >(null);

  if (!client?.clientProfile.id) {
    throw new Error('Something went wrong. Please try again.');
  }

  return (
    <View style={{ flex: 1 }}>
      <InteractionsMap
        setSelectedLocation={setSelectedLocation}
        clientProfileId={client.clientProfile.id}
      />
      <InteractionLocationsModal
        selectedLocation={selectedLocation}
        setSelectedLocation={setSelectedLocation}
      />
    </View>
  );
}
