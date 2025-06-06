import { ClientProfileForm } from '@monorepo/expo/betterangels';
import { useLocalSearchParams } from 'expo-router';

export default function EditClientScreen() {
  const { id: clientId, componentName } = useLocalSearchParams<{
    id: string;
    componentName: string;
  }>();
  if (!clientId || !componentName) {
    throw new Error('Something went wrong. Please try again.');
  }

  return <ClientProfileForm id={clientId} componentName={componentName} />;
}
