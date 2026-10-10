import {
  ClientEditHmis,
  ClientProfileForm,
  DEFAULT_STANDARD_SECTION,
  getClientProfileSectionOrDefault,
  useUser,
} from '@monorepo/expo/betterangels';
import { useLocalSearchParams } from 'expo-router';

export default function EditClientScreen() {
  const { id: clientId, componentName } = useLocalSearchParams<{
    id: string;
    componentName: string;
  }>();

  if (!clientId) {
    throw new Error('Something went wrong. Please try again.');
  }

  const section = getClientProfileSectionOrDefault(
    componentName,
    DEFAULT_STANDARD_SECTION,
  );

  const { user } = useUser();

  if (user?.isHmisUser) {
    return <ClientEditHmis id={clientId} componentName={section} />;
  }

  return <ClientProfileForm id={clientId} componentName={section} />;
}
