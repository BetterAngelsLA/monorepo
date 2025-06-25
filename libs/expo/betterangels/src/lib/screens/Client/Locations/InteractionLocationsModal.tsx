import { BottomSheetModal } from '@monorepo/expo/shared/ui-components';
import { useEffect, useState } from 'react';
import { TNotesQueryInteraction } from '../../../apollo';
import { NoteCard } from '../../../ui-components';
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
    <BottomSheetModal title={selectedInteraction.location?.address.street}>
      <NoteCard
        note={selectedInteraction}
        variant={'clientProfile'}
        hasBorder
      />
    </BottomSheetModal>
  );
}
