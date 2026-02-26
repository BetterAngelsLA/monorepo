import { NoteViewHmis } from '@monorepo/expo/betterangels';
import { useLocalSearchParams } from 'expo-router';

export default function InteractionsViewHmis() {
  const { id, clientId } = useLocalSearchParams<{
    id: string;
    clientId: string;
  }>();

  if (!id || !clientId) {
    throw new Error('Something went wrong. Please try again.');
  }

  return <NoteViewHmis id={id} clientId={clientId} />;
}
