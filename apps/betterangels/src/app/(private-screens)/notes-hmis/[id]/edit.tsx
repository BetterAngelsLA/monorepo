import { NoteEditHmis } from '@monorepo/expo/betterangels';
import { useLocalSearchParams } from 'expo-router';

type TSearchParams = {
  id: string;
  clientId: string;
  arrivedFrom?: string;
};

export default function InteractionsEditHmis() {
  const { id, clientId, arrivedFrom } = useLocalSearchParams<TSearchParams>();

  if (!id || !clientId) {
    throw new Error('Something went wrong. Please try again.');
  }

  return <NoteEditHmis id={id} clientId={clientId} arrivedFrom={arrivedFrom} />;
}
