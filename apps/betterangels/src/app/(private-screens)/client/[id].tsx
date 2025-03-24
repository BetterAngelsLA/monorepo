import {
  Client,
  ClientProfileCardEnum,
  isValidClientProfileCardEnum,
} from '@monorepo/expo/betterangels';
import { useLocalSearchParams } from 'expo-router';

type TSearchParams = {
  id: string;
  arrivedFrom?: string;
  openCard?: string;
};

export default function ClientScreen() {
  const { id, arrivedFrom, openCard } = useLocalSearchParams<TSearchParams>();

  if (!id) {
    throw new Error('Something went wrong. Please try again.');
  }

  let openCardName: ClientProfileCardEnum | undefined = undefined;

  if (isValidClientProfileCardEnum(openCard)) {
    openCardName = openCard as ClientProfileCardEnum;
  }

  return <Client id={id} arrivedFrom={arrivedFrom} openCard={openCardName} />;
}
