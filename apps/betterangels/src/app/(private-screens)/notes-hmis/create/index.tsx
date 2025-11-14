import { HmisProgramNoteCreate } from '@monorepo/expo/betterangels';
import { useLocalSearchParams } from 'expo-router';

type TSearchParams = {
  hmisClientId: string;
  arrivedFrom?: string;
};

export default function InteractionsHmisCreateScreen() {
  const { hmisClientId, arrivedFrom } = useLocalSearchParams<TSearchParams>();

  if (!hmisClientId) {
    throw new Error('Something went wrong. Please try again.');
  }

  return (
    <HmisProgramNoteCreate
      hmisClientId={hmisClientId}
      arrivedFrom={arrivedFrom}
    />
  );
}
