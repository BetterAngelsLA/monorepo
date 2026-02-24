import {
  CreateClientProfile,
  CreateClientProfileHmis,
  useUser,
} from '@monorepo/expo/betterangels';

export default function CreateClientProfileScreen() {
  const { isHmisUser } = useUser();

  if (isHmisUser) {
    return <CreateClientProfileHmis />;
  }

  return <CreateClientProfile />;
}
