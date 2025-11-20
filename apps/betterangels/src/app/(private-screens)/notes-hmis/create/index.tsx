import { HmisProgramNoteCreate } from '@monorepo/expo/betterangels';
import { useLocalSearchParams } from 'expo-router';

type TSearchParams = {
  clientHmisId: string;
  arrivedFrom?: string;
};

export default function InteractionsHmisCreateScreen() {
  const { clientHmisId, arrivedFrom } = useLocalSearchParams<TSearchParams>();

  if (!clientHmisId) {
    throw new Error('Something went wrong. Please try again.');
  }

  return (
    <HmisProgramNoteCreate
      clientHmisId={clientHmisId}
      arrivedFrom={arrivedFrom}
    />
  );
}
