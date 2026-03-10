import { NoteCreateHmis } from '@monorepo/expo/betterangels';
import { useLocalSearchParams } from 'expo-router';

type TSearchParams = {
  clientId: string;
  arrivedFrom?: string;
};

export default function InteractionsCreateScreenHmis() {
  const { clientId, arrivedFrom } = useLocalSearchParams<TSearchParams>();

  if (!clientId) {
    throw new Error('Something went wrong. Please try again.');
  }

  return <NoteCreateHmis clientId={clientId} arrivedFrom={arrivedFrom} />;
}
