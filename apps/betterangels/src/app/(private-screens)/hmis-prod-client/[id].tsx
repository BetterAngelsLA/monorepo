import { ClientHmisProd } from '@monorepo/expo/betterangels';
import { useLocalSearchParams } from 'expo-router';

type TSearchParams = {
  id: string;
  arrivedFrom?: string;
};

export default function ClientHmisProdScreen() {
  const { id, arrivedFrom } = useLocalSearchParams<TSearchParams>();

  if (!id) {
    throw new Error('Something went wrong. Please try again.');
  }

  return <ClientHmisProd id={id} arrivedFrom={arrivedFrom} />;
}
