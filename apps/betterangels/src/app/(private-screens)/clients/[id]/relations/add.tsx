import {
  ClientProfileRelatedModelForm,
  DEFAULT_RELATED_MODEL_SECTION,
  getClientProfileSectionOrDefault,
} from '@monorepo/expo/betterangels';
import { useLocalSearchParams } from 'expo-router';

export default function ClientRelatedModelAddScreen() {
  const { id: clientProfileId, componentName } = useLocalSearchParams<{
    id: string;
    componentName: string;
  }>();

  if (!clientProfileId) {
    throw new Error('Something went wrong. Please try again.');
  }

  const section = getClientProfileSectionOrDefault(
    componentName,
    DEFAULT_RELATED_MODEL_SECTION,
  );

  return (
    <ClientProfileRelatedModelForm
      clientProfileId={clientProfileId}
      componentName={section}
      createMode={true}
    />
  );
}
