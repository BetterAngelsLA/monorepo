import {
  CreateClientProfile,
  CreateClientProfileHmis,
  useUser,
} from '@monorepo/expo/betterangels';

export default function CreateClientProfileScreen() {
  const { user } = useUser();

  if (user?.isHmisUser) {
    return <CreateClientProfileHmis />;
  }

  return <CreateClientProfile />;
}
