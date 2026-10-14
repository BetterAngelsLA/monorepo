import {
  ClientProfileRelatedModelForm,
  DEFAULT_RELATED_MODEL_SECTION,
  getClientProfileSectionOrDefault,
} from '@monorepo/expo/betterangels';
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

  if (!clientProfileId || !relationId) {
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
      relationId={relationId}
    />
  );
}
