import {
  ClientEditHmis,
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

  const { user } = useUser();

  if (user?.isHmisUser) {
    return <ClientEditHmis id={clientId} componentName={componentName} />;
  }

  return <ClientProfileForm id={clientId} componentName={componentName} />;
}
