import {
  ClientProfileRelatedModelList,
  DEFAULT_RELATED_MODEL_SECTION,
  getClientProfileSectionOrDefault,
} from '@monorepo/expo/betterangels';
import { useLocalSearchParams } from 'expo-router';

export default function ClientRelationsListScreen() {
  const { id: clientId, componentName } = useLocalSearchParams<{
    id: string;
    componentName: string;
  }>();

  if (!clientId) {
    throw new Error('Something went wrong. Please try again.');
  }

  const section = getClientProfileSectionOrDefault(
    componentName,
    DEFAULT_RELATED_MODEL_SECTION,
  );

  return (
    <ClientProfileRelatedModelList clientId={clientId} componentName={section} />
  );
}
