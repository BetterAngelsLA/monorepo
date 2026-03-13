import { NoteEditorScreen } from '@monorepo/expo/betterangels';
import { useLocalSearchParams } from 'expo-router';

export default function NoteEditRoute() {
  const { id, arrivedFrom } = useLocalSearchParams<{
    id: string;
    arrivedFrom: string;
  }>();

  return <NoteEditorScreen mode="edit" noteId={id} arrivedFrom={arrivedFrom} />;
}
