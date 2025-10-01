import {
  CreateClientProfile,
  CreateClientProfileHMIS,
  useUser,
} from '@monorepo/expo/betterangels';

export default function CreateClientProfileScreen() {
  const { isHmisUser } = useUser();

  if (isHmisUser) {
    return <CreateClientProfileHMIS />;
  }

  return <CreateClientProfile />;
}
