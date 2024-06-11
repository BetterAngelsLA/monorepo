import { PublicNote } from '@monorepo/expo/betterangels';
import { useLocalSearchParams } from 'expo-router';

export default function PublicNoteScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  if (!id) {
    throw new Error('Something went wrong. Please try again.');
  }
  return <PublicNote noteId={id} />;
}
