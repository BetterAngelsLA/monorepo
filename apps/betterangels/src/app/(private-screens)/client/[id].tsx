import { Client } from '@monorepo/expo/betterangels';
import { useLocalSearchParams } from 'expo-router';

export default function ClientScreen() {
  const { id, arrivedFrom } = useLocalSearchParams<{
    id: string;
    arrivedFrom?: string;
  }>();

  if (!id) {
    throw new Error('Something went wrong. Please try again.');
  }

  return <Client id={id} arrivedFrom={arrivedFrom} />;
}
