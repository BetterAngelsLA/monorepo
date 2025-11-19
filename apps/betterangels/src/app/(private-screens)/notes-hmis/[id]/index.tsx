import { HmisProgramNoteView } from '@monorepo/expo/betterangels';
import { useLocalSearchParams } from 'expo-router';

export default function InteractionsHmisiew() {
  const { id: noteHmisId, personalId: clientHmisId } = useLocalSearchParams<{
    id: string;
    personalId: string;
  }>();

  if (!noteHmisId || !clientHmisId) {
    throw new Error('Something went wrong. Please try again.');
  }

  return (
    <HmisProgramNoteView noteHmisId={noteHmisId} clientHmisId={clientHmisId} />
  );
}
