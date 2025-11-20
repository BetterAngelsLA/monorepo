import { HmisProgramNoteEdit } from '@monorepo/expo/betterangels';
import { useLocalSearchParams } from 'expo-router';

type TSearchParams = {
  id: string;
  clientHmisId: string;
  arrivedFrom?: string;
};

export default function InteractionsHmisEdit() {
  const {
    id: noteHmisId,
    clientHmisId,
    arrivedFrom,
  } = useLocalSearchParams<TSearchParams>();

  if (!noteHmisId || !clientHmisId) {
    throw new Error('Something went wrong. Please try again.');
  }

  return (
    <HmisProgramNoteEdit
      noteHmisId={noteHmisId}
      clientHmisId={clientHmisId}
      arrivedFrom={arrivedFrom}
    />
  );
}
