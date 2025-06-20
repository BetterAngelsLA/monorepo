import { Colors, Spacings } from '@monorepo/expo/shared/static';
import { TextBold } from '@monorepo/expo/shared/ui-components';
import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { TNotesQueryInteraction } from '../../../apollo';
import { Modal, NoteCard } from '../../../ui-components';
import { useInteractionsMapState } from './map/hooks';

export function InteractionLocationsModal() {
  const { mapState } = useInteractionsMapState();
  const [selectedInteraction, setSelectedInteraction] =
    useState<TNotesQueryInteraction | null>(null);

  const { selectedInteractions } = mapState;

  useEffect(() => {
    if (!selectedInteractions.length) {
      setSelectedInteraction(null);

      return;
    }

    const currentInteraction = selectedInteractions[0];

    if (currentInteraction.id === selectedInteraction?.id) {
      return;
    }

    setSelectedInteraction(currentInteraction);
  }, [selectedInteractions]);

  if (!selectedInteraction) {
    return null;
  }

  return (
    <Modal
      fullWidth={false}
      propogateSwipe
      vertical
      isModalVisible={!!selectedInteraction}
      closeModal={() => setSelectedInteraction(null)}
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
        <TextBold>{selectedInteraction.location?.address.street}</TextBold>
      </View>
      <View
        style={{
          paddingHorizontal: Spacings.sm,
          gap: Spacings.sm,
        }}
      >
        <NoteCard
          // onPress={() => setSelectedLocation(null)}
          note={selectedInteraction}
          variant={'clientProfile'}
          hasBorder
        />
      </View>
    </Modal>
  );
}
