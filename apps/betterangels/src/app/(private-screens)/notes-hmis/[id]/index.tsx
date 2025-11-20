import { HmisProgramNoteView } from '@monorepo/expo/betterangels';
import { useLocalSearchParams } from 'expo-router';

export default function InteractionsHmisView() {
  const { id: noteHmisId, clientHmisId } = useLocalSearchParams<{
    id: string;
    clientHmisId: string;
  }>();

  if (!noteHmisId || !clientHmisId) {
    throw new Error('Something went wrong. Please try again.');
  }

  return (
    <HmisProgramNoteView noteHmisId={noteHmisId} clientHmisId={clientHmisId} />
  );
}
