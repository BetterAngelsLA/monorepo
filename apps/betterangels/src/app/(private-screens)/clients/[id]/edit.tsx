import {
  ClientHMISEdit,
  ClientProfileForm,
  useUser,
} from '@monorepo/expo/betterangels';
import { useLocalSearchParams } from 'expo-router';

export default function EditClientScreen() {
  const { id: clientId, componentName } = useLocalSearchParams<{
    id: string;
    componentName: string;
  }>();
  if (!clientId || !componentName) {
    throw new Error('Something went wrong. Please try again.');
  }

  const { isHmisUser } = useUser();

  if (isHmisUser) {
    return <ClientHMISEdit id={clientId} componentName={componentName} />;
  }

  return <ClientProfileForm id={clientId} componentName={componentName} />;
}
