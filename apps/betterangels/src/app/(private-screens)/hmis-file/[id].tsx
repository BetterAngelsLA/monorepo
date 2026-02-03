import { HmisFileInfoScreen } from '@monorepo/expo/betterangels';
import { useLocalSearchParams } from 'expo-router';

export default function HmisFileInfoRoute() {
  const { id, label, createdAt, clientId } = useLocalSearchParams<{
    id: string;
    label?: string;
    createdAt?: string;
    clientId?: string;
  }>();

  if (!id) {
    throw new Error('Something went wrong. Please try again.');
  }

  return (
    <HmisFileInfoScreen
      id={id}
      label={label}
      createdAt={createdAt}
      clientId={clientId}
    />
  );
}
