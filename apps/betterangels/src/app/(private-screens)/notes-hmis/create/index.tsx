import { HmisProgramNoteCreate } from '@monorepo/expo/betterangels';
import { useLocalSearchParams } from 'expo-router';

type TSearchParams = {
  clientId: string;
  arrivedFrom?: string;
};

export default function InteractionsHmisCreateScreen() {
  const { clientId, arrivedFrom } = useLocalSearchParams<TSearchParams>();

  if (!clientId) {
    throw new Error('Something went wrong. Please try again.');
  }

  return (
    <HmisProgramNoteCreate clientId={clientId} arrivedFrom={arrivedFrom} />
  );
}
