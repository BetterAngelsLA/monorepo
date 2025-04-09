import { ClientProfileRelatedModelForm } from '@monorepo/expo/betterangels';
import { useLocalSearchParams } from 'expo-router';

export default function ClientRelatedModelAddScreen() {
  const { id: clientId, componentName } = useLocalSearchParams<{
    id: string;
    componentName: string;
  }>();

  if (!clientId || !componentName) {
    throw new Error('Something went wrong. Please try again.');
  }

  return (
    <ClientProfileRelatedModelForm
      clientId={clientId}
      componentName={componentName}
      createMode={true}
    />
  );
}
