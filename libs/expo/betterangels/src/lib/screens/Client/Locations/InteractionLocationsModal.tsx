import { BottomSheetModal } from '@monorepo/expo/shared/ui-components';
import { NotesQuery } from '../../../apollo';
import { NoteCard } from '../../../ui-components';

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
    <BottomSheetModal title={selectedLocation.location?.address.street}>
      <NoteCard
        onPress={() => setSelectedLocation(null)}
        note={selectedLocation}
        variant={'clientProfile'}
        hasBorder
      />
    </BottomSheetModal>
  );
}
