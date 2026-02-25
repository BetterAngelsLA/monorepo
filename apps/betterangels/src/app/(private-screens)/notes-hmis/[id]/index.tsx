import { HmisProgramNoteView } from '@monorepo/expo/betterangels';
import { useLocalSearchParams } from 'expo-router';

export default function InteractionsHmisView() {
  const { id, clientId } = useLocalSearchParams<{
    id: string;
    clientId: string;
  }>();

  if (!id || !clientId) {
    throw new Error('Something went wrong. Please try again.');
  }

  return <HmisProgramNoteView id={id} clientId={clientId} />;
}
