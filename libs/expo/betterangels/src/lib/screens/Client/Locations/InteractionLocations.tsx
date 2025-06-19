import { useState } from 'react';
import { View } from 'react-native';
import { NotesQuery } from '../../../apollo';

import { ClientProfileQuery } from '../__generated__/Client.generated';
import { InteractionLocationsMap } from './InteractionLocationsMap';
import { InteractionLocationsModal } from './InteractionLocationsModal';

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
      <InteractionLocationsMap
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
