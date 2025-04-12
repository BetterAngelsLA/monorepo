import { ClientProfileRelatedModelForm } from '@monorepo/expo/betterangels';
import { useLocalSearchParams } from 'expo-router';

export default function ClientRelatedModelEditScreen() {
  const {
    id: clientProfileId,
    relationId,
    componentName,
  } = useLocalSearchParams<{
    id: string;
    relationId: string;
    componentName: string;
  }>();

  if (!clientProfileId || !componentName || !relationId) {
    throw new Error('Something went wrong. Please try again.');
  }

  return (
    <ClientProfileRelatedModelForm
      clientProfileId={clientProfileId}
      componentName={componentName}
      relationId={relationId}
    />
  );
}
