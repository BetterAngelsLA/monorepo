import { View } from 'react-native';
import { InteractionLocationsModal } from './InteractionLocationsModal';
import { InteractionsMap } from './map/InteractionsMap';

type TProps = {
  clientProfileId?: string;
};

export function InteractionLocations(props: TProps) {
  const { clientProfileId } = props;

  if (!clientProfileId) {
    throw new Error('Something went wrong. Please try again.');
  }

  return (
    <View style={{ flex: 1 }}>
      <InteractionsMap clientProfileId={clientProfileId} />
      <InteractionLocationsModal />
    </View>
  );
}
