import { HmisProgramNoteEdit } from '@monorepo/expo/betterangels';
import { useLocalSearchParams } from 'expo-router';

type TSearchParams = {
  id: string;
  clientId: string;
  arrivedFrom?: string;
};

export default function InteractionsHmisEdit() {
  const { id, clientId, arrivedFrom } = useLocalSearchParams<TSearchParams>();

  if (!id || !clientId) {
    throw new Error('Something went wrong. Please try again.');
  }

  return (
    <HmisProgramNoteEdit
      id={id}
      clientId={clientId}
      arrivedFrom={arrivedFrom}
    />
  );
}
