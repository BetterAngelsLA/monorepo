import { Colors, Spacings } from '@monorepo/expo/shared/static';
import { TextBold } from '@monorepo/expo/shared/ui-components';
import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { TNotesQueryInteraction } from '../../../apollo';
import { Modal, NoteCard } from '../../../ui-components';
import { useInteractionsMapState } from './map/InteractionsMapStateContext';

export function InteractionLocationsModal() {
  const { state: mapState } = useInteractionsMapState();
  const [selectedInteractions, setSelectedInteractions] = useState<
    TNotesQueryInteraction[]
  >([]);

  const { selectedInteractions: stateInteractions } = mapState;

  useEffect(() => {
    if (!stateInteractions.length) {
      setSelectedInteractions([]);

      return;
    }

    setSelectedInteractions(stateInteractions);
  }, [stateInteractions]);

  if (!selectedInteractions.length) {
    return null;
  }

  const primaryInteraction = selectedInteractions[0];

  return (
    <Modal
      fullWidth={false}
      propogateSwipe
      vertical
      isModalVisible={!!selectedInteractions}
      closeModal={() => setSelectedInteractions([])}
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
        <TextBold>{primaryInteraction.location?.address.street}</TextBold>
      </View>
      <View
        style={{
          paddingHorizontal: Spacings.sm,
          gap: Spacings.sm,
        }}
      >
        {selectedInteractions.map((interaction) => {
          return (
            <NoteCard
              key={interaction.id}
              // onPress={() => setSelectedLocation(null)}
              note={interaction}
              variant={'clientProfile'}
              hasBorder
            />
          );
        })}
      </View>
    </Modal>
  );
}
