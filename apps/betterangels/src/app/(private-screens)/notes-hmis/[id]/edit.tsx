import { HmisProgramNoteEdit } from '@monorepo/expo/betterangels';
import { useLocalSearchParams } from 'expo-router';

type TSearchParams = {
  id: string;
  arrivedFrom?: string;
};

export default function InteractionsHmisEdit() {
  const { id, arrivedFrom } = useLocalSearchParams<TSearchParams>();

  if (!id) {
    throw new Error('Something went wrong. Please try again.');
  }

  return <HmisProgramNoteEdit id={id} arrivedFrom={arrivedFrom} />;
}
