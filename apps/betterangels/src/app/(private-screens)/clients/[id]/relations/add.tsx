import { ClientProfileRelatedModelForm } from '@monorepo/expo/betterangels';
import { useLocalSearchParams } from 'expo-router';

export default function ClientRelatedModelAddScreen() {
  const { id: clientProfileId, componentName } = useLocalSearchParams<{
    id: string;
    componentName: string;
  }>();

  if (!clientProfileId || !componentName) {
    throw new Error('Something went wrong. Please try again.');
  }

  return (
    <ClientProfileRelatedModelForm
      clientProfileId={clientProfileId}
      componentName={componentName}
      createMode={true}
    />
  );
}
