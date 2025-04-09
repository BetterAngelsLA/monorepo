import { ClientProfileRelatedModelForm } from '@monorepo/expo/betterangels';
import { useLocalSearchParams } from 'expo-router';

export default function ClientRelatedModelEditScreen() {
  const {
    id: clientId,
    relationId,
    componentName,
  } = useLocalSearchParams<{
    id: string;
    relationId: string;
    componentName: string;
  }>();

  if (!clientId || !componentName || !relationId) {
    throw new Error('Something went wrong. Please try again.');
  }

  return (
    <ClientProfileRelatedModelForm
      clientId={clientId}
      componentName={componentName}
      relationId={relationId}
    />
  );
}
