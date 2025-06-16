import { Colors, Spacings } from '@monorepo/expo/shared/static';
import { TextBold } from '@monorepo/expo/shared/ui-components';
import { View } from 'react-native';
import { NotesQuery } from '../../../apollo';
import { Modal, NoteCard } from '../../../ui-components';

interface InteractionLocationsModalProps {
  selectedLocation: NotesQuery['notes']['results'][number] | null;
  setSelectedLocation: (
    location: NotesQuery['notes']['results'][number] | null
  ) => void;
}

export function InteractionLocationsModal(
  props: InteractionLocationsModalProps
) {
  const { selectedLocation, setSelectedLocation } = props;

  if (!selectedLocation) {
    return null;
  }

  return (
    <Modal
      propogateSwipe
      vertical
      isModalVisible={!!selectedLocation}
      closeModal={() => setSelectedLocation(null)}
    >
      <View
        style={{
          borderBottomWidth: 1,
          borderColor: Colors.NEUTRAL_LIGHT,
          marginBottom: Spacings.sm,
          paddingBottom: Spacings.xs,
          paddingHorizontal: Spacings.sm,
        }}
      >
        <TextBold>{selectedLocation.location?.address.street}</TextBold>
      </View>
      <View
        style={{
          padding: Spacings.sm,
        }}
      >
        <NoteCard
          onPress={() => setSelectedLocation(null)}
          note={selectedLocation}
          variant={'clientProfile'}
          hasBorder
        />
      </View>
    </Modal>
  );
}
