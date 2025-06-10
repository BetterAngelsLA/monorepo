import { FileScreenComponent } from '@monorepo/expo/betterangels';
import { useLocalSearchParams } from 'expo-router';

export default function FileScreen() {
  const { id, editing } = useLocalSearchParams<{
    id: string;
    editing: boolean;
  }>();

  if (!id) {
    throw new Error('Something went wrong. Please try again.');
  }

  return <FileScreenComponent id={id} editing={editing} />;
}
