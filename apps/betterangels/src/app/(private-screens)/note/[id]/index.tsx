import { Note } from '@monorepo/expo/betterangels';
import { useLocalSearchParams } from 'expo-router';

export default function NoteScreen() {
  const { id, arrivedFrom } = useLocalSearchParams<{
    id: string;
    arrivedFrom?: string;
  }>();

  if (!id) {
    throw new Error('Something went wrong. Please try again.');
  }

  return <Note id={id} arrivedFrom={arrivedFrom} />;
}
