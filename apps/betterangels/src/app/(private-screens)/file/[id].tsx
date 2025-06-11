import { FileScreenComponent } from '@monorepo/expo/betterangels';
import { useLocalSearchParams } from 'expo-router';

export default function FileScreen() {
  const { id, clientId, editing } = useLocalSearchParams<{
    id: string;
    clientId: string;
    editing: boolean;
  }>();

  if (!id) {
    throw new Error('Something went wrong. Please try again.');
  }

  return <FileScreenComponent id={id} clientId={clientId} editing={editing} />;
}
